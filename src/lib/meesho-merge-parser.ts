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

type OrderAccumulator = {
  subOrderId: string;
  orderId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  saleAmount: number;
  taxableAmount: number;
  shipping: number;
  commission: number;
  returnAmount: number;
  rtoAmount: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  isReturn: boolean;
  isRto: boolean;
  isCancelled: boolean;
  orderDate?: Date;
  state?: string;
  pincode?: string;
  sources: Set<string>;
};

function subOrderKey(row: Record<string, string>): string | undefined {
  return (
    pick(row, [
      "sub order num",
      "sub order no",
      "sub order number",
      "sub order id",
      "sub order",
      "sub_order_num",
      "suborder num",
    ]) ??
    pick(row, ["order id", "order num", "order number", "order no"])
  );
}

function parseDate(raw?: string): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseStatus(row: Record<string, string>) {
  const status = (pick(row, ["order status", "status", "delivery status", "shipment status"]) ?? "").toLowerCase();
  return {
    isReturn: /return|refund|cancel.*return/.test(status),
    isRto: /\brto\b|return to origin/.test(status),
    isCancelled: /cancel/.test(status) && !/return/.test(status),
  };
}

function extractStatePincode(row: Record<string, string>) {
  const stateRaw = pick(row, [
    "end customer state new",
    "end customer state",
    "end consignee state",
    "customer state",
    "consignee state",
    "reseller state",
    "ship to state",
    "shipping state",
    "delivery state",
    "state",
    "place of supply",
    "buyer state",
  ]);
  const pincodeRaw = pick(row, [
    "end customer pincode",
    "customer pincode",
    "consignee pincode",
    "ship to pincode",
    "pincode",
    "pin code",
    "postal code",
  ]);
  return {
    state: resolveOrderState(stateRaw, pincodeRaw),
    pincode: pincodeRaw?.replace(/\D/g, "").slice(0, 6) || undefined,
  };
}

function getOrCreate(map: Map<string, OrderAccumulator>, key: string): OrderAccumulator {
  const existing = map.get(key);
  if (existing) return existing;

  const acc: OrderAccumulator = {
    subOrderId: key,
    quantity: 1,
    saleAmount: 0,
    taxableAmount: 0,
    shipping: 0,
    commission: 0,
    returnAmount: 0,
    rtoAmount: 0,
    gst: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    isReturn: false,
    isRto: false,
    isCancelled: false,
    sources: new Set(),
  };
  map.set(key, acc);
  return acc;
}

function ingestOrdersRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  acc.sources.add("orders");

  acc.orderId = pick(row, ["order num", "order number", "order id"]) ?? acc.orderId;
  acc.sku = pick(row, ["sku", "supplier sku", "style id", "product sku", "hsn code"]) ?? acc.sku;
  acc.productName =
    pick(row, ["product name", "product title", "item name", "description"]) ?? acc.productName;

  const qty = parseInt(pick(row, ["quantity", "qty", "units"]) ?? "1", 10);
  if (qty > 0) acc.quantity = qty;

  const settlement = parseNumber(
    pick(row, [
      "bank settlement amount",
      "final settlement",
      "settlement amount",
      "supplier discounted price",
      "supplier price",
      "sale amount",
      "order amount",
    ])
  );
  if (settlement > 0) acc.saleAmount = Math.max(acc.saleAmount, settlement);

  acc.commission = Math.max(
    acc.commission,
    parseNumber(pick(row, ["meesho commission", "commission", "platform fee", "marketplace fee"]))
  );
  acc.shipping = Math.max(
    acc.shipping,
    parseNumber(pick(row, ["shipping charge", "shipping", "logistics charge", "forward shipping"]))
  );
  acc.returnAmount = Math.max(
    acc.returnAmount,
    parseNumber(pick(row, ["return amount", "return charge", "return penalty"]))
  );
  acc.rtoAmount = Math.max(
    acc.rtoAmount,
    parseNumber(pick(row, ["rto amount", "rto charge", "rto loss", "reverse shipping"]))
  );

  const status = parseStatus(row);
  acc.isReturn = acc.isReturn || status.isReturn || acc.returnAmount > 0;
  acc.isRto = acc.isRto || status.isRto || acc.rtoAmount > 0;
  acc.isCancelled = acc.isCancelled || status.isCancelled;

  const dateStr = pick(row, ["order date", "date", "shipment date"]);
  acc.orderDate = parseDate(dateStr) ?? acc.orderDate;

  const { state, pincode } = extractStatePincode(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;
}

function ingestGstSaleRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  acc.sources.add("gst_sale");

  const taxable = parseNumber(
    pick(row, [
      "tcs taxable amount",
      "total taxable sale value",
      "taxable amount",
      "taxable value",
      "total taxable value",
    ])
  );
  const invoiceValue = parseNumber(
    pick(row, ["total invoice value", "invoice value", "total invoice amount"])
  );

  if (taxable > 0) {
    acc.taxableAmount = Math.max(acc.taxableAmount, taxable);
    acc.saleAmount = Math.max(acc.saleAmount, taxable);
  } else if (invoiceValue > 0) {
    acc.saleAmount = Math.max(acc.saleAmount, invoiceValue);
  }

  const cgst = parseNumber(pick(row, ["cgst amount", "cgst"]));
  const sgst = parseNumber(pick(row, ["sgst amount", "sgst"]));
  const igst = parseNumber(pick(row, ["igst amount", "igst"]));
  const taxAmount = parseNumber(pick(row, ["tax amount", "total tax", "gst amount"]));

  acc.cgst += cgst;
  acc.sgst += sgst;
  acc.igst += igst;
  acc.gst = Math.max(acc.gst, taxAmount || cgst + sgst + igst);

  acc.sku = pick(row, ["hsn code", "sku", "product name"]) ?? acc.sku;
  acc.productName = pick(row, ["product name", "description"]) ?? acc.productName;

  const qty = parseInt(pick(row, ["quantity", "qty"]) ?? "0", 10);
  if (qty > 0) acc.quantity = qty;

  const dateStr = pick(row, ["order date", "invoice date", "date"]);
  acc.orderDate = parseDate(dateStr) ?? acc.orderDate;

  const { state, pincode } = extractStatePincode(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;
}

function ingestGstReturnRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  acc.sources.add("gst_return");
  acc.isReturn = true;

  const returnTaxable = Math.abs(
    parseNumber(
      pick(row, [
        "tcs taxable amount",
        "total taxable sale value",
        "taxable amount",
        "return amount",
        "taxable value",
      ])
    )
  );
  const returnTax = Math.abs(
    parseNumber(pick(row, ["tax amount", "total tax", "igst amount", "cgst amount", "sgst amount"]))
  );

  acc.returnAmount = Math.max(acc.returnAmount, returnTaxable || returnTax);
  acc.gst = Math.max(acc.gst, returnTax);

  const { state, pincode } = extractStatePincode(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;

  const dateStr = pick(row, ["return date", "order date", "invoice date"]);
  acc.orderDate = parseDate(dateStr) ?? acc.orderDate;
}

function accToLine(acc: OrderAccumulator): ParsedOrderLine {
  const revenue = acc.taxableAmount > 0 ? acc.taxableAmount : acc.saleAmount;
  const netProfit =
    revenue -
    acc.returnAmount -
    acc.commission -
    acc.shipping -
    acc.rtoAmount -
    (acc.isReturn ? 0 : 0);

  return {
    orderId: acc.subOrderId,
    sku: acc.sku,
    productName: acc.productName,
    quantity: acc.quantity,
    saleAmount: revenue,
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
  };
}

/** Merge Meesho Orders + GST Sale + GST Sale Return into unified P&L */
export function parseMeeshoMergedReports(input: MeeshoMergeInput): {
  lines: ParsedOrderLine[];
  summary: ReportSummary;
} {
  const map = new Map<string, OrderAccumulator>();

  for (const row of input.ordersRows ?? []) ingestOrdersRow(map, row);
  for (const row of input.gstSaleRows ?? []) ingestGstSaleRow(map, row);
  for (const row of input.gstReturnRows ?? []) ingestGstReturnRow(map, row);

  if (map.size === 0) {
    throw new Error(
      "No orders found. Upload Meesho Orders + GST Sale Excel (sub_order_num column required)."
    );
  }

  const lines = [...map.values()]
    .filter((acc) => !acc.isCancelled)
    .map(accToLine);

  if (lines.length === 0) {
    throw new Error("All rows were cancelled or empty. Check your Meesho files.");
  }

  const activeLines = lines.filter((l) => !l.isReturn || l.saleAmount > 0);
  const grossRevenue = activeLines.reduce((s, l) => s + l.saleAmount, 0);
  const returnCharges = lines.reduce((s, l) => s + l.returnAmount, 0);
  const shippingCharges = lines.reduce((s, l) => s + l.shipping, 0);
  const marketplaceCharges = lines.reduce((s, l) => s + l.commission, 0);
  const rtoLoss = lines.reduce((s, l) => s + l.rtoAmount, 0);
  const gstImpact = lines.reduce((s, l) => s + l.gst, 0);

  const netSales = grossRevenue - returnCharges;
  const netProfit = netSales - marketplaceCharges - shippingCharges - rtoLoss;

  const returnCount = lines.filter((l) => l.isReturn).length;
  const rtoCount = lines.filter((l) => l.isRto).length;
  const totalOrders = lines.length;

  const summary: ReportSummary = {
    grossRevenue,
    marketplaceCharges,
    shippingCharges,
    returnCharges,
    rtoLoss,
    gstImpact,
    netProfit,
    totalOrders,
    returnCount,
    rtoCount,
    returnRate: totalOrders ? (returnCount / totalOrders) * 100 : 0,
    rtoRate: totalOrders ? (rtoCount / totalOrders) * 100 : 0,
    ordersByState: aggregateByState(lines),
    netTaxableSales: netSales,
    gstSaleTotal: grossRevenue,
    gstReturnTotal: returnCharges,
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
    const rows = await fileToRows(files.legacySingle);
    const { parseMeeshoCsv } = await import("@/lib/meesho-parser");
    const text = await files.legacySingle.text();
    return parseMeeshoCsv(text);
  }

  if (!files.orders && !files.gstSale) {
    throw new Error("Upload Meesho Orders Excel and GST Sale Excel.");
  }

  const [ordersRows, gstSaleRows, gstReturnRows] = await Promise.all([
    files.orders ? fileToRows(files.orders) : Promise.resolve(undefined),
    files.gstSale ? fileToRows(files.gstSale) : Promise.resolve(undefined),
    files.gstReturn ? fileToRows(files.gstReturn) : Promise.resolve(undefined),
  ]);

  return parseMeeshoMergedReports({ ordersRows, gstSaleRows, gstReturnRows });
}
