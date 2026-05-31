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

export function costKey(sku: string, size = "") {
  return `${sku}::${size || ""}`;
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
    const sku = (l.sku ?? "unknown").trim();
    const size = (l.size ?? "").trim();
    const key = costKey(sku, size);
    if (seen.has(key)) continue;
    seen.set(key, {
      sku,
      size,
      productName: l.productName ?? sku,
      productCost: 0,
      packCost: 0,
    });
  }

  const ops = [...seen.values()].map((row) => ({
    updateOne: {
      filter: { reportId, sku: row.sku, size: row.size },
      update: {
        $setOnInsert: {
          userId,
          reportId,
          sku: row.sku,
          size: row.size,
          productName: row.productName,
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
    productCost: r.productCost,
    packCost: r.packCost,
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
      productCost: c.productCost,
      packCost: c.packCost,
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
        `"${r.sku.replace(/"/g, '""')}"`,
        `"${(r.size || "").replace(/"/g, '""')}"`,
        `"${r.productName.replace(/"/g, '""')}"`,
        r.productCost.toFixed(2),
        r.packCost.toFixed(2),
      ].join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseSkuCostCsv(text: string): SkuCostRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const rows: SkuCostRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    if (!parts[0]) continue;
    rows.push({
      sku: parts[0],
      size: parts[1] ?? "",
      productName: parts[2] || parts[0],
      productCost: parseFloat(parts[3]) || 0,
      packCost: parseFloat(parts[4]) || 0,
    });
  }
  return rows;
}

export function countLossSkus(lines: ParsedOrderLine[]) {
  const skuMap = aggregateBySku(lines);
  return skuMap.filter((s) => s.profit < -1).length;
}
