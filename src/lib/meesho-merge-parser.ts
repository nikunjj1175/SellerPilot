import { resolveOrderState } from "@/lib/pincode-state";
import { parseNumber, pick } from "@/lib/csv-utils";
import {
  orderNetProfitExGst,
  splitTaxableAndShipping,
  sumLineEconomics,
} from "@/lib/meesho-calc";
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
  /** Product taxable ex-GST (excludes shipping component) */
  taxableAmount: number;
  gst: number;
  shipping: number;
  returnAmount: number;
  rtoAmount: number;
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
    "suborder no",
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

function readGstAmounts(row: Record<string, string>) {
  const totalTaxable = parseNumber(
    pick(row, [
      "total taxable sale value",
      "tcs taxable amount",
      "taxable amount",
      "total taxable value",
    ])
  );
  const tax = parseNumber(
    pick(row, ["tax amount", "total tax", "gst amount", "igst amount", "cgst amount"])
  );
  const ship = parseNumber(
    pick(row, [
      "taxable shipping",
      "shipping taxable",
      "shipping charges",
      "shipping",
      "forward shipping",
    ])
  );
  const commission = parseNumber(
    pick(row, [
      "commission",
      "meesho commission",
      "platform commission",
      "commission amount",
      "marketplace fee",
    ])
  );
  return { totalTaxable, tax, ship, commission };
}

function addForwardTaxable(acc: OrderAccumulator, totalTaxable: number, ship: number) {
  const { productTaxable, shipping } = splitTaxableAndShipping(totalTaxable, ship);
  acc.taxableAmount += productTaxable;
  acc.shipping += shipping;
}

function addReturnTaxable(acc: OrderAccumulator, amount: number) {
  if (amount <= 0) return;
  acc.returnAmount += amount;
  acc.isReturn = true;
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
        "supplier discounted price (incl gst and commission)",
        "supplier discounted price",
        "supplier listed price (incl. gst + commission)",
        "supplier listed price",
        "supplier price",
      ])
    );
    const listed = parseNumber(
      pick(row, [
        "supplier listed price (incl. gst + commission)",
        "supplier listed price",
        "product price",
        "listing price",
      ])
    );
    if (supplier > 0) existing.supplierPrice = Math.max(existing.supplierPrice, supplier);
    if (listed > 0) existing.listedPrice = Math.max(existing.listedPrice, listed);

    existing.productName =
      pick(row, ["product name", "product title", "product"]) ?? existing.productName;
    existing.sku =
      pick(row, ["sku", "catalog id", "style id", "product id"]) ?? existing.sku;
    existing.size =
      pick(row, ["size", "product size", "variant", "size name"]) ?? existing.size;

    const qty = parseInt(pick(row, ["quantity", "qty"]) ?? "1", 10);
    if (qty > 0) existing.quantity = qty;

    const dateStr = pick(row, ["order date", "date", "order created at"]);
    existing.orderDate = parseDate(dateStr) ?? existing.orderDate;

    const { state } = extractState(row);
    if (state && state !== "Unknown") existing.state = state;

    meta.set(key, existing);
  }

  return meta;
}

function computeGstFileTotals(
  gstSaleRows: Record<string, string>[],
  gstReturnRows: Record<string, string>[]
) {
  let forwardTaxable = 0;
  let forwardGst = 0;
  let forwardShip = 0;
  let adjustmentReturns = 0;

  for (const row of gstSaleRows) {
    const { totalTaxable, tax, ship } = readGstAmounts(row);
    if (totalTaxable >= 0) {
      forwardTaxable += totalTaxable;
      forwardGst += tax;
      forwardShip += ship;
    } else {
      adjustmentReturns += Math.abs(totalTaxable);
    }
  }

  let returnTaxable = 0;
  let returnGst = 0;
  let returnShip = 0;

  for (const row of gstReturnRows) {
    const { totalTaxable, tax, ship } = readGstAmounts(row);
    returnTaxable += Math.abs(totalTaxable);
    returnGst += Math.abs(tax);
    returnShip += Math.abs(ship);
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

/** Latest Reason for Credit Entry wins (Meesho Orders CSV timeline). */
export function resolveFinalOrderStatus(meta: MeeshoOrderMeta): string {
  const reasons = meta.reasons.map((r) => r.toUpperCase().trim()).filter(Boolean);
  if (!reasons.length) return "UNKNOWN";
  const last = reasons[reasons.length - 1];
  if (last.includes("CANCEL")) return "CANCELLED";
  if (last.includes("RTO")) return "RTO";
  if (last.includes("EXCHANGE")) return "EXCHANGE";
  if (last.includes("RETURN")) return "RETURN";
  if (last === "DELIVERED") return "DELIVERED";
  if (last === "LOST") return "LOST";
  return last;
}

function countOrderStats(orderMeta: Map<string, MeeshoOrderMeta>) {
  let rtoCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let returnCount = 0;

  for (const meta of orderMeta.values()) {
    const status = resolveFinalOrderStatus(meta);
    if (status === "RTO") rtoCount++;
    else if (status === "RETURN" || status === "EXCHANGE") returnCount++;
    else if (status === "DELIVERED") deliveredCount++;
    else if (status === "CANCELLED") cancelledCount++;
  }

  return { rtoCount, deliveredCount, cancelledCount, returnCount };
}

function applyOrderMeta(acc: OrderAccumulator, meta: MeeshoOrderMeta) {
  const finalStatus = resolveFinalOrderStatus(meta);
  acc.orderReason = finalStatus;
  acc.orderStatus = finalStatus;

  acc.isCancelled = finalStatus === "CANCELLED";
  acc.isRto = finalStatus === "RTO" || acc.isRto;
  acc.isReturn =
    finalStatus === "RETURN" ||
    finalStatus === "EXCHANGE" ||
    acc.isReturn;
  acc.isLost = finalStatus === "LOST";

  acc.productName = meta.productName ?? acc.productName;
  acc.sku = meta.sku ?? acc.sku;
  acc.quantity = meta.quantity || acc.quantity;
  acc.orderDate = meta.orderDate ?? acc.orderDate;
  if (meta.state && meta.state !== "Unknown") acc.state = meta.state;

  if (meta.listedPrice > 0 && meta.supplierPrice > 0) {
    const comm = meta.listedPrice - meta.supplierPrice;
    if (comm > acc.commission) acc.commission = comm;
  }
  if (meta.supplierPrice > 0) acc.supplierPrice = meta.supplierPrice;
  if (meta.size) acc.size = meta.size;
}

function ingestGstSaleRow(map: Map<string, OrderAccumulator>, row: Record<string, string>) {
  const key = subOrderKey(row);
  if (!key) return;

  const acc = getOrCreate(map, key);
  const { totalTaxable, tax, ship, commission } = readGstAmounts(row);

  if (totalTaxable < 0) {
    addReturnTaxable(acc, Math.abs(totalTaxable));
  } else if (totalTaxable > 0) {
    addForwardTaxable(acc, totalTaxable, ship);
  }

  if (tax !== 0) acc.gst += Math.abs(tax);
  if (commission > 0) acc.commission += commission;

  acc.sku = pick(row, ["hsn code", "sku", "product name"]) ?? acc.sku;
  acc.productName = pick(row, ["product name", "description"]) ?? acc.productName;

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
  const { totalTaxable, tax, ship, commission } = readGstAmounts(row);

  addReturnTaxable(acc, Math.abs(totalTaxable));
  if (tax !== 0) acc.gst += Math.abs(tax);
  if (ship > 0) acc.shipping += ship;
  if (commission > 0) acc.commission += commission;

  const { state, pincode } = extractState(row);
  if (state && state !== "Unknown") acc.state = state;
  if (pincode) acc.pincode = pincode;

  acc.orderDate =
    parseDate(pick(row, ["cancel return date", "order date", "manifest date", "date"])) ??
    acc.orderDate;
}

/**
 * Real-world settlement rules after merging GST + order status.
 */
function finalizeOrderEconomics(acc: OrderAccumulator) {
  if (acc.isCancelled) {
    acc.taxableAmount = 0;
    acc.returnAmount = 0;
    acc.shipping = 0;
    acc.commission = 0;
    acc.rtoAmount = 0;
    return;
  }

  // RTO: forward GST may exist; reverse product value, keep logistics cost as loss
  if (acc.isRto) {
    if (acc.taxableAmount > 0 && acc.returnAmount === 0) {
      acc.returnAmount += acc.taxableAmount;
      acc.taxableAmount = 0;
    }
    const logisticsCost = acc.shipping + acc.commission;
    if (logisticsCost > acc.rtoAmount) {
      acc.rtoAmount = logisticsCost;
    }
  }

  if (acc.isLost) {
    const loss = acc.taxableAmount + acc.shipping + acc.commission;
    acc.rtoAmount = Math.max(acc.rtoAmount, loss);
    acc.taxableAmount = 0;
    acc.returnAmount = 0;
  }

  // Customer return with only return file (no forward in sale file for same month)
  if (acc.isReturn && acc.returnAmount > 0 && acc.taxableAmount > 0) {
    acc.returnAmount = Math.max(acc.returnAmount, acc.taxableAmount);
    acc.taxableAmount = 0;
  }
}

function accToLine(acc: OrderAccumulator): ParsedOrderLine {
  finalizeOrderEconomics(acc);

  const netProfit = orderNetProfitExGst({
    saleAmount: acc.taxableAmount,
    returnAmount: acc.returnAmount,
    shipping: acc.shipping,
    commission: acc.commission,
    rtoAmount: acc.rtoAmount,
  });

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
    isCancelled: acc.isCancelled,
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

  for (const [key, meta] of orderMeta) {
    const acc = getOrCreate(map, key);
    applyOrderMeta(acc, meta);
  }

  if (map.size === 0) {
    throw new Error(
      "No data found. Upload Orders CSV + tcs_sales.xlsx (+ tcs_sales_return.xlsx)."
    );
  }

  const lines = [...map.values()].map(accToLine).filter((line) => {
    if (line.isCancelled || line.orderStatus?.toUpperCase() === "CANCELLED") {
      return true;
    }
    return (
      line.saleAmount > 0 ||
      line.returnAmount > 0 ||
      line.rtoAmount > 0 ||
      line.isReturn ||
      line.isRto
    );
  });

  if (lines.length === 0) {
    throw new Error("No billable orders found in uploaded files.");
  }

  const gst = computeGstFileTotals(input.gstSaleRows ?? [], input.gstReturnRows ?? []);
  const stats = countOrderStats(orderMeta);
  const totals = sumLineEconomics(lines);

  const grossOrders = orderMeta.size || lines.length;
  const cancelledCount = stats.cancelledCount || lines.filter((l) => l.isCancelled).length;
  const netOrders = Math.max(0, grossOrders - cancelledCount);

  const summary: ReportSummary = {
    grossRevenue: totals.grossProductSales,
    marketplaceCharges: totals.marketplaceCharges,
    shippingCharges: totals.shippingCharges,
    returnCharges: totals.returnCharges,
    rtoLoss: totals.rtoLoss,
    gstImpact: gst.netGst,
    profitBeforeCosts: totals.netProfit,
    productCostTotal: 0,
    packCostTotal: 0,
    netProfit: totals.netProfit,
    totalOrders: netOrders,
    grossOrderCount: grossOrders,
    cancelledCount,
    netOrders,
    returnCount: stats.returnCount || totals.returnCount,
    rtoCount: stats.rtoCount || totals.rtoCount,
    returnRate: grossOrders ? ((stats.returnCount || totals.returnCount) / grossOrders) * 100 : 0,
    rtoRate: grossOrders ? (stats.rtoCount / grossOrders) * 100 : 0,
    ordersByState: aggregateByState(lines),
    netTaxableSales: gst.netTaxable,
    gstSaleTotal: gst.forwardTaxable,
    gstReturnTotal: gst.returnTaxable,
    grossRevenueExGst: gst.forwardTaxable,
    gstCollected: gst.netGst,
    shippingExGst: gst.netShip,
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
