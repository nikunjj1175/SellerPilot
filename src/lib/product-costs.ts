import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { OrderLine, ProductSkuCost, Report } from "@/models";
import type { IReport } from "@/models/Report";
import {
  aggregateBySku,
  aggregateByState,
  type ParsedOrderLine,
  type ReportSummary,
} from "@/lib/meesho-parser";

export type SkuCostRow = {
  id?: string;
  sku: string;
  size: string;
  productName: string;
  productCost: number;
  packCost: number;
};

export function normalizeSkuSize(sku: string, size = "") {
  return {
    sku: sku.trim(),
    size: size.trim(),
  };
}

export function costKey(sku: string, size = "") {
  const { sku: s, size: z } = normalizeSkuSize(sku, size);
  return `${s}::${z}`;
}

export function lineBaseProfit(line: {
  saleAmount: number;
  returnAmount: number;
  shipping: number;
  rtoAmount: number;
  commission: number;
}) {
  return (
    line.saleAmount - line.returnAmount - line.shipping - line.rtoAmount - line.commission
  );
}

export function lineProfitWithCosts(
  line: {
    saleAmount: number;
    returnAmount: number;
    shipping: number;
    rtoAmount: number;
    commission: number;
    quantity: number;
    isReturn?: boolean;
    orderStatus?: string;
  },
  productCost: number,
  packCost: number
) {
  const base = lineBaseProfit(line);
  const status = (line.orderStatus ?? "").toUpperCase();
  const skipCost =
    status.includes("CANCEL") ||
    (line.saleAmount <= 0 && line.returnAmount <= 0 && !line.isReturn);

  if (skipCost) return base;

  const qty = Math.max(1, line.quantity);
  return base - productCost * qty - packCost;
}

export async function seedSkuCostsFromOrderLines(
  userId: string | mongoose.Types.ObjectId,
  reportId: mongoose.Types.ObjectId
) {
  const lines = await OrderLine.find({ reportId }).select("sku size productName").lean();
  const seen = new Map<string, SkuCostRow>();

  for (const l of lines) {
    const { sku, size } = normalizeSkuSize(l.sku ?? "unknown", l.size ?? "");
    const key = costKey(sku, size);
    if (seen.has(key)) continue;
    seen.set(key, {
      sku,
      size,
      productName: (l.productName ?? sku).trim(),
      productCost: 0,
      packCost: 0,
    });
  }

  const ops = [...seen.values()].map((row) => ({
    updateOne: {
      filter: { reportId, sku: row.sku, size: row.size },
      update: {
        $set: { productName: row.productName },
        $setOnInsert: {
          userId,
          reportId,
          sku: row.sku,
          size: row.size,
          productCost: 0,
          packCost: 0,
        },
      },
      upsert: true,
    },
  }));

  if (ops.length) await ProductSkuCost.bulkWrite(ops);
}

export async function getSkuCostRows(
  userId: string,
  reportId: string,
  opts?: { search?: string; page?: number; pageSize?: number }
): Promise<{
  rows: SkuCostRow[];
  total: number;
  uniqueSkus: number;
  page: number;
  pageSize: number;
}> {
  await connectDB();
  const reportObjectId = new mongoose.Types.ObjectId(reportId);
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, opts?.pageSize ?? 100));
  const search = opts?.search?.trim().toLowerCase();

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    reportId: reportObjectId,
  };

  const all = await ProductSkuCost.find(query).sort({ sku: 1, size: 1 }).lean();
  let rows: SkuCostRow[] = all.map((r) => ({
    id: String(r._id),
    sku: r.sku,
    size: r.size ?? "",
    productName: r.productName,
    productCost: r.productCost ?? 0,
    packCost: r.packCost ?? 0,
  }));

  if (search) {
    rows = rows.filter(
      (r) =>
        r.sku.toLowerCase().includes(search) ||
        r.productName.toLowerCase().includes(search) ||
        r.size.toLowerCase().includes(search)
    );
  }

  const uniqueSkus = new Set(rows.map((r) => r.sku)).size;
  const total = rows.length;
  const start = (page - 1) * pageSize;
  rows = rows.slice(start, start + pageSize);

  return { rows, total, uniqueSkus, page, pageSize };
}

export async function recalculateReportWithProductCosts(
  userId: string,
  reportId: string
): Promise<ReportSummary | null> {
  await connectDB();
  const reportObjectId = new mongoose.Types.ObjectId(reportId);

  const report = await Report.findOne({
    _id: reportObjectId,
    userId,
    status: "COMPLETED",
  }).lean<IReport | null>();

  if (!report?.summary) return null;

  const costs = await ProductSkuCost.find({ reportId: reportObjectId }).lean();
  const costMap = new Map<string, { productCost: number; packCost: number }>();
  for (const c of costs) {
    costMap.set(costKey(c.sku, c.size ?? ""), {
      productCost: c.productCost ?? 0,
      packCost: c.packCost ?? 0,
    });
  }

  const lines = await OrderLine.find({ reportId: reportObjectId });
  let productCostTotal = 0;
  let packCostTotal = 0;
  let netProfitSum = 0;

  const bulkOps: Parameters<typeof OrderLine.bulkWrite>[0] = [];

  for (const line of lines) {
    const sku = line.sku ?? "unknown";
    const size = line.size ?? "";
    const costsForSku = costMap.get(costKey(sku, size)) ?? { productCost: 0, packCost: 0 };
    const qty = Math.max(1, line.quantity);
    const status = (line.orderStatus ?? "").toUpperCase();
    const skipCost =
      status.includes("CANCEL") ||
      (line.saleAmount <= 0 && line.returnAmount <= 0);

    const productLineCost = skipCost ? 0 : costsForSku.productCost * qty;
    const packLineCost = skipCost ? 0 : costsForSku.packCost;

    const netProfit = lineProfitWithCosts(
      {
        saleAmount: line.saleAmount,
        returnAmount: line.returnAmount,
        shipping: line.shipping,
        rtoAmount: line.rtoAmount,
        commission: line.commission,
        quantity: line.quantity,
        isReturn: line.isReturn,
        orderStatus: line.orderStatus,
      },
      costsForSku.productCost,
      costsForSku.packCost
    );

    productCostTotal += productLineCost;
    packCostTotal += packLineCost;
    netProfitSum += netProfit;

    bulkOps.push({
      updateOne: {
        filter: { _id: line._id },
        update: {
          productCost: costsForSku.productCost,
          packCost: costsForSku.packCost,
          netProfit,
        },
      },
    });
  }

  if (bulkOps.length) {
    await OrderLine.bulkWrite(bulkOps);
  }

  const oldSummary = report.summary as ReportSummary;
  const profitBeforeCosts =
    oldSummary.profitBeforeCosts ??
    (oldSummary.netTaxableSales ?? oldSummary.grossRevenue) -
      (oldSummary.shippingExGst ?? oldSummary.shippingCharges);

  const parsedLines: ParsedOrderLine[] = lines.map((l) => {
    const sku = l.sku ?? "unknown";
    const size = l.size ?? "";
    const c = costMap.get(costKey(sku, size)) ?? { productCost: 0, packCost: 0 };
    return {
      orderId: l.orderId,
      sku: l.sku,
      productName: l.productName,
      quantity: l.quantity,
      saleAmount: l.saleAmount,
      shipping: l.shipping,
      commission: l.commission,
      returnAmount: l.returnAmount,
      rtoAmount: l.rtoAmount,
      gst: l.gst,
      netProfit: lineProfitWithCosts(l, c.productCost, c.packCost),
      isReturn: l.isReturn,
      isRto: l.isRto,
      orderDate: l.orderDate,
      state: l.state,
      pincode: l.pincode,
      orderStatus: l.orderStatus,
      supplierPrice: l.supplierPrice,
      size: l.size,
      productCost: c.productCost,
      packCost: c.packCost,
    };
  });

  const hasCosts = productCostTotal > 0 || packCostTotal > 0;
  const summary: ReportSummary = {
    ...oldSummary,
    profitBeforeCosts,
    productCostTotal,
    packCostTotal,
    netProfit: hasCosts ? netProfitSum : profitBeforeCosts,
    lossSkuCount: countLossSkus(parsedLines),
    ordersByState: aggregateByState(parsedLines.filter((l) => l.saleAmount > 0)),
  };

  await Report.findByIdAndUpdate(reportObjectId, { summary });
  return summary;
}

export function skuRowsToCsv(rows: SkuCostRow[]) {
  const header = "SKU,Size,Product Name,Product Cost (Incl GST),Packaging Cost (Incl GST)";
  const body = rows
    .map((r) =>
      [
        csvCell(r.sku),
        csvCell(r.size),
        csvCell(r.productName),
        (r.productCost ?? 0).toFixed(2),
        (r.packCost ?? 0).toFixed(2),
      ].join(",")
    )
    .join("\n");
  return `\uFEFF${header}\n${body}`;
}

function csvCell(value: string) {
  const v = value ?? "";
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function unquoteCell(value: string) {
  const t = value.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/""/g, '"').trim();
  }
  return t;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => unquoteCell(c));
}

type ColumnMap = {
  sku: number;
  size: number;
  name: number;
  productCost: number;
  packCost: number;
};

function detectColumns(headerParts: string[]): ColumnMap | null {
  const h = headerParts.map((p) => p.toLowerCase());
  const idx = (...needles: string[]) =>
    h.findIndex((col) => needles.some((n) => col.includes(n)));

  const sku = idx("sku");
  if (sku < 0) return null;

  const size = idx("size");
  const name = idx("product name", "productname", "product");
  const productCost = idx("product cost", "purchase price", "purchase");
  const packCost = idx("packaging", "packing", "pack cost", "pack cost");

  return {
    sku,
    size: size >= 0 ? size : 1,
    name: name >= 0 ? name : 2,
    productCost: productCost >= 0 ? productCost : 3,
    packCost: packCost >= 0 ? packCost : 4,
  };
}

function parseMoney(raw: string) {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function parseSkuCostCsv(text: string): SkuCostRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const firstParts = splitCsvLine(lines[0]);
  const hasHeader = firstParts.some((p) => p.toLowerCase().includes("sku"));
  const cols = hasHeader ? detectColumns(firstParts) : null;
  const startIdx = hasHeader ? 1 : 0;

  const map: ColumnMap = cols ?? {
    sku: 0,
    size: 1,
    name: 2,
    productCost: 3,
    packCost: 4,
  };

  const rows: SkuCostRow[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    const { sku, size } = normalizeSkuSize(parts[map.sku] ?? "", parts[map.size] ?? "");
    if (!sku) continue;

    rows.push({
      sku,
      size,
      productName: (parts[map.name] ?? sku).trim() || sku,
      productCost: parseMoney(parts[map.productCost] ?? "0"),
      packCost: parseMoney(parts[map.packCost] ?? "0"),
    });
  }

  return rows;
}

export function countLossSkus(lines: ParsedOrderLine[]) {
  const skuMap = aggregateBySku(lines);
  return skuMap.filter((s) => s.profit < -1).length;
}
