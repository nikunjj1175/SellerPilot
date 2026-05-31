import { resolveOrderState } from "@/lib/pincode-state";
import { parseNumber, pick } from "@/lib/csv-utils";
import {
  aggregateByState,
  type ParsedOrderLine,
  type ReportSummary,
} from "@/lib/meesho-parser";

export type MeeshoMergeInput = {
  ordersRows?: Record<string, string>[];
  gstSaleRows?: Record<string, string>[];
  gstReturnRows?: Record<string, string>[];
};

type MeeshoOrderMeta = {
  reasons: string[];
  supplierPrice: number;
  listedPrice: number;
  productName?: string;
  sku?: string;
  size?: string;
  quantity: number;
  orderDate?: Date;
  state?: string;
};

type OrderAccumulator = {
  subOrderId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  /** Taxable value ex-GST (forward sale) */
  taxableAmount: number;
  /** GST amount — informational, not deducted from profit */
  gst: number;
  /** Taxable shipping ex-GST */
  shipping: number;
  /** Return taxable ex-GST */
  returnAmount: number;
  /** RTO / lost loss ex-GST */
  rtoAmount: number;
  /** Meesho commission estimate ex-GST */
  commission: number;
  isReturn: boolean;
  isRto: boolean;
  isCancelled: boolean;
  isLost: boolean;
  orderDate?: Date;
  state?: string;
  pincode?: string;
  orderReason?: string;
  supplierPrice?: number;
  orderStatus?: string;
  size?: string;
};

function subOrderKey(row: Record<string, string>): string | undefined {
  return pick(row, [
    "sub order num",
    "sub order no",
    "sub order number",
    "sub order id",
    "sub order",
    "suborder num",
  ]);
}

function parseDate(raw?: string): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

function extractState(row: Record<string, string>) {
  const stateRaw = pick(row, [
    "end customer state new",
    "end customer state",
    "customer state",
    "consignee state",
    "reseller state",
    "ship to state",
    "shipping state",
    "delivery state",
    "state",
    "place of supply",
  ]);
  const pincodeRaw = pick(row, [
    "end customer pincode",
    "customer pincode",
    "ship to pincode",
    "pincode",
    "pin code",
  ]);
  return {
    state: resolveOrderState(stateRaw, pincodeRaw),
    pincode: pincodeRaw?.replace(/\D/g, "").slice(0, 6) || undefined,
  };
}

function getOrCreate(map: Map<string, OrderAccumulator>, key: string): OrderAccumulator {
  let acc = map.get(key);
  if (acc) return acc;
  acc = {
    subOrderId: key,
    quantity: 1,
    taxableAmount: 0,
    gst: 0,
    shipping: 0,
    returnAmount: 0,
    rtoAmount: 0,
    commission: 0,
    isReturn: false,
    isRto: false,
    isCancelled: false,
    isLost: false,
  };
  map.set(key, acc);
  return acc;
}

/** Meesho Orders CSV — Reason for Credit Entry */
function buildOrderMeta(rows: Record<string, string>[]) {
  const meta = new Map<string, MeeshoOrderMeta>();

  for (const row of rows) {
    const key = subOrderKey(row);
    if (!key) continue;

    const reason =
      pick(row, ["reason for credit entry", "order status", "status"])?.toUpperCase() ?? "";
    const existing = meta.get(key) ?? {
      reasons: [],
      supplierPrice: 0,
      listedPrice: 0,
      quantity: 1,
    };

    if (reason) existing.reasons.push(reason);

    const supplier = parseNumber(
      pick(row, [
        "supplier discounted price (incl gst and commision)",
        "supplier discounted price",
        "supplier listed price (incl. gst + commission)",
        "supplier listed price",
      ])
    );
    const listed = parseNumber(
      pick(row, ["supplier listed price (incl. gst + commission)", "supplier listed price"])
    );
    if (supplier > 0) existing.supplierPrice = Math.max(existing.supplierPrice, supplier);
    if (listed > 0) existing.listedPrice = Math.max(existing.listedPrice, listed);

    existing.productName =
      pick(row, ["product name", "product title"]) ?? existing.productName;
    existing.sku = pick(row, ["sku", "catalog id"]) ?? existing.sku;
    existing.size =
      pick(row, ["size", "product size", "variant", "size name"]) ?? existing.size;

    const qty = parseInt(pick(row, ["quantity", "qty"]) ?? "1", 10);
    if (qty > 0) existing.quantity = qty;

    const dateStr = pick(row, ["order date", "date"]);
    existing.orderDate = parseDate(dateStr) ?? existing.orderDate;

    const { state } = extractState(row);
    if (state && state !== "Unknown") existing.state = state;

    meta.set(key, existing);
  }

  return meta;
}

function computeGstTotals(
  gstSaleRows: Record<string, string>[],
  gstReturnRows: Record<string, string>[]
) {
  let forwardTaxable = 0;
  let forwardGst = 0;
  let forwardShip = 0;
  let adjustmentReturns = 0;

  for (const row of gstSaleRows) {
    const taxable = parseNumber(
      pick(row, ["total taxable sale value", "tcs taxable amount", "taxable amount"])
    );
    const tax = parseNumber(pick(row, ["tax amount", "total tax"]));
    const ship = parseNumber(pick(row, ["taxable shipping", "shipping"]));

    if (taxable >= 0) {
      forwardTaxable += taxable;
      forwardGst += tax;
      forwardShip += ship;
    } else {
      adjustmentReturns += Math.abs(taxable);
    }
  }

  let returnTaxable = 0;
  let returnGst = 0;
  let returnShip = 0;

  for (const row of gstReturnRows) {
    returnTaxable += Math.abs(
      parseNumber(pick(row, ["total taxable sale value", "tcs taxable amount", "taxable amount"]))
    );
    returnGst += Math.abs(parseNumber(pick(row, ["tax amount", "total tax"])));
    returnShip += Math.abs(parseNumber(pick(row, ["taxable shipping", "shipping"])));
  }

  returnTaxable += adjustmentReturns;

  return {
    forwardTaxable,
    forwardGst,
    forwardShip,
    returnTaxable,
    returnGst,
    returnShip,
    netTaxable: forwardTaxable - returnTaxable,
    netShip: forwardShip - returnShip,
    netGst: forwardGst - returnGst,
  };
}

function countOrderStats(orderMeta: Map<string, MeeshoOrderMeta>) {
  let rtoCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;

  for (const meta of orderMeta.values()) {
    const reasons = meta.reasons.map((r) => r.toUpperCase());
    if (reasons.some((r) => r.includes("RTO"))) rtoCount++;
    else if (reasons.some((r) => r === "DELIVERED")) deliveredCount++;
    else if (reasons.every((r) => r === "CANCELLED")) cancelledCount++;
  }

  return { rtoCount, deliveredCount, cancelledCount };
}

function applyOrderMeta(acc: OrderAccumulator, meta: MeeshoOrderMeta) {
  const reasons = meta.reasons.map((r) => r.toUpperCase());
  acc.orderReason = reasons[reasons.length - 1] ?? acc.orderReason;

  acc.isRto = reasons.some((r) => r.includes("RTO"));
  acc.isReturn =
    acc.isReturn ||
    reasons.some((r) => r.includes("EXCHANGE") || r.includes("RETURN"));
  const allCancelled =
    reasons.length > 0 && reasons.every((r) => r === "CANCELLED");
  const hasDelivered = (reasons as string[]).some((r) => r === "DELIVERED");
  acc.isCancelled = allCancelled && !hasDelivered;
  acc.isLost = reasons.some((r) => r === "LOST");

  acc.productName = meta.productName ?? acc.productName;
  acc.sku = meta.sku ?? acc.sku;
  acc.quantity = meta.quantity || acc.quantity;
  acc.orderDate = meta.orderDate ?? acc.orderDate;
  if (meta.state && meta.state !== "Unknown") acc.state = meta.state;

  if (meta.listedPrice > 0 && meta.supplierPrice > 0) {
    acc.commission = Math.max(acc.commission, meta.listedPrice - meta.supplierPrice);
  }
  if (meta.supplierPrice > 0) acc.supplierPrice = meta.supplierPrice;
  if (meta.reasons.length) acc.orderStatus = meta.reasons[meta.reasons.length - 1];
  if (meta.size) acc.size = meta.size;
}

function ingestGstSaleRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  const taxable = parseNumber(
    pick(row, ["total taxable sale value", "tcs taxable amount", "taxable amount"])
  );
  const tax = parseNumber(pick(row, ["tax amount", "total tax", "gst amount"]));
  const ship = parseNumber(pick(row, ["taxable shipping", "shipping taxable", "shipping"]));

  if (taxable < 0) {
    acc.returnAmount = Math.max(acc.returnAmount, Math.abs(taxable));
    acc.isReturn = true;
  } else if (taxable > 0) {
    acc.taxableAmount = Math.max(acc.taxableAmount, taxable);
  }

  if (tax !== 0) acc.gst = Math.max(acc.gst, Math.abs(tax));
  if (ship !== 0) acc.shipping = Math.max(acc.shipping, Math.abs(ship));

  acc.sku = pick(row, ["hsn code", "sku"]) ?? acc.sku;
  const qty = parseInt(pick(row, ["quantity", "qty"]) ?? "0", 10);
  if (qty > 0) acc.quantity = qty;

  acc.orderDate = parseDate(pick(row, ["order date", "manifest date", "date"])) ?? acc.orderDate;

  const { state, pincode } = extractState(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;
}

function ingestGstReturnRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  acc.isReturn = true;

  const returnTaxable = Math.abs(
    parseNumber(pick(row, ["total taxable sale value", "tcs taxable amount", "taxable amount"]))
  );
  const returnTax = Math.abs(parseNumber(pick(row, ["tax amount", "total tax"])));
  const returnShip = Math.abs(parseNumber(pick(row, ["taxable shipping", "shipping"])));

  acc.returnAmount = Math.max(acc.returnAmount, returnTaxable);
  acc.gst = Math.max(acc.gst, returnTax);
  if (returnShip > 0) acc.shipping = Math.max(acc.shipping, returnShip);

  const { state, pincode } = extractState(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;

  acc.orderDate =
    parseDate(pick(row, ["cancel return date", "order date", "manifest date"])) ?? acc.orderDate;
}

function accToLine(acc: OrderAccumulator): ParsedOrderLine {
  /** Net profit EX-GST — GST is pass-through, not deducted */
  const netProfit =
    acc.taxableAmount - acc.returnAmount - acc.shipping - acc.rtoAmount - acc.commission;

  return {
    orderId: acc.subOrderId,
    sku: acc.sku,
    productName: acc.productName,
    quantity: acc.quantity,
    saleAmount: acc.taxableAmount,
    shipping: acc.shipping,
    commission: acc.commission,
    returnAmount: acc.returnAmount,
    rtoAmount: acc.rtoAmount,
    gst: acc.gst,
    netProfit,
    isReturn: acc.isReturn,
    isRto: acc.isRto,
    orderDate: acc.orderDate,
    state: acc.state,
    pincode: acc.pincode,
    orderStatus: acc.orderStatus,
    supplierPrice: acc.supplierPrice,
    size: acc.size,
  };
}

/** Merge Meesho Orders CSV + tcs_sales.xlsx + tcs_sales_return.xlsx */
export function parseMeeshoMergedReports(input: MeeshoMergeInput): {
  lines: ParsedOrderLine[];
  summary: ReportSummary;
} {
  const map = new Map<string, OrderAccumulator>();
  const orderMeta = buildOrderMeta(input.ordersRows ?? []);

  for (const row of input.gstSaleRows ?? []) ingestGstSaleRow(map, row);
  for (const row of input.gstReturnRows ?? []) ingestGstReturnRow(map, row);

  // Enrich with order CSV (status, product, state)
  for (const [key, meta] of orderMeta) {
    const acc = getOrCreate(map, key);
    applyOrderMeta(acc, meta);
  }

  if (map.size === 0) {
    throw new Error(
      "No data found. Upload Orders CSV + tcs_sales.xlsx (+ tcs_sales_return.xlsx)."
    );
  }

  const lines = [...map.values()]
    .filter((acc) => {
      if (acc.isCancelled && acc.taxableAmount === 0 && !acc.isReturn) return false;
      return acc.taxableAmount > 0 || acc.returnAmount > 0 || acc.isReturn || acc.isRto;
    })
    .map(accToLine);

  if (lines.length === 0) {
    throw new Error("No billable orders found in uploaded files.");
  }

  const gst = computeGstTotals(input.gstSaleRows ?? [], input.gstReturnRows ?? []);
  const stats = countOrderStats(orderMeta);

  const grossRevenueExGst = gst.forwardTaxable;
  const returnCharges = gst.returnTaxable;
  const shippingCharges = gst.netShip;
  const gstCollected = gst.netGst;
  const netTaxableSales = gst.netTaxable;
  /** Net profit ex-GST = taxable sales − returns − shipping (GST shown separately) */
  const netProfit = netTaxableSales - shippingCharges;

  const returnCount = (input.gstReturnRows ?? []).length;
  const rtoCount = stats.rtoCount;
  const totalOrders = (input.gstSaleRows ?? []).length;

  const summary: ReportSummary = {
    grossRevenue: grossRevenueExGst,
    marketplaceCharges: lines.reduce((s, l) => s + l.commission, 0),
    shippingCharges: gst.forwardShip,
    returnCharges,
    rtoLoss: 0,
    gstImpact: gstCollected,
    profitBeforeCosts: netProfit,
    productCostTotal: 0,
    packCostTotal: 0,
    netProfit,
    totalOrders,
    returnCount,
    rtoCount,
    returnRate: totalOrders ? (returnCount / totalOrders) * 100 : 0,
    rtoRate: orderMeta.size ? (rtoCount / orderMeta.size) * 100 : 0,
    ordersByState: aggregateByState(lines.filter((l) => l.saleAmount > 0)),
    netTaxableSales,
    gstSaleTotal: grossRevenueExGst,
    gstReturnTotal: returnCharges,
    grossRevenueExGst,
    gstCollected,
    shippingExGst: shippingCharges,
  };

  return { lines, summary };
}

export async function parseMeeshoFromFiles(files: {
  orders?: File;
  gstSale?: File;
  gstReturn?: File;
  legacySingle?: File;
}) {
  const { fileToRows } = await import("@/lib/spreadsheet");

  if (files.legacySingle && !files.orders && !files.gstSale) {
    const { parseMeeshoCsv } = await import("@/lib/meesho-parser");
    const text = await files.legacySingle.text();
    return parseMeeshoCsv(text);
  }

  if (!files.gstSale && !files.orders) {
    throw new Error("Upload Meesho Orders CSV and tcs_sales.xlsx.");
  }

  const [ordersRows, gstSaleRows, gstReturnRows] = await Promise.all([
    files.orders ? fileToRows(files.orders) : Promise.resolve(undefined),
    files.gstSale ? fileToRows(files.gstSale) : Promise.resolve(undefined),
    files.gstReturn ? fileToRows(files.gstReturn) : Promise.resolve(undefined),
  ]);

  return parseMeeshoMergedReports({ ordersRows, gstSaleRows, gstReturnRows });
}
