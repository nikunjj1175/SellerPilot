import { resolveOrderState } from "@/lib/pincode-state";
import { parseNumber, pick, parseCsvRowsFromText } from "@/lib/csv-utils";

export type ParsedOrderLine = {
  orderId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  saleAmount: number;
  shipping: number;
  commission: number;
  returnAmount: number;
  rtoAmount: number;
  gst: number;
  netProfit: number;
  isReturn: boolean;
  isRto: boolean;
  isCancelled?: boolean;
  orderDate?: Date;
  state?: string;
  pincode?: string;
  orderStatus?: string;
  supplierPrice?: number;
  size?: string;
  productCost?: number;
  packCost?: number;
};

export type StateOrderStats = {
  state: string;
  orderCount: number;
  revenue: number;
  returnCount: number;
  rtoCount: number;
  cancelledCount?: number;
};

export type ReportSummary = {
  grossRevenue: number;
  marketplaceCharges: number;
  shippingCharges: number;
  returnCharges: number;
  rtoLoss: number;
  gstImpact: number;
  netProfit: number;
  totalOrders: number;
  /** All sub-orders from Orders CSV */
  grossOrderCount?: number;
  cancelledCount?: number;
  netOrders?: number;
  returnCount: number;
  rtoCount: number;
  returnRate: number;
  rtoRate: number;
  ordersByState?: StateOrderStats[];
  /** Meesho merged: net taxable after returns */
  netTaxableSales?: number;
  gstSaleTotal?: number;
  gstReturnTotal?: number;
  /** Meesho: revenue ex-GST (taxable) */
  grossRevenueExGst?: number;
  /** Total GST collected — informational */
  gstCollected?: number;
  shippingExGst?: number;
  productCostTotal?: number;
  packCostTotal?: number;
  /** Profit before product & pack costs (ex-GST) */
  profitBeforeCosts?: number;
  lossSkuCount?: number;
  /** Report month YYYY-MM */
  reportMonth?: string;
  /** Extra monthly costs (ads, rent) deducted from net profit */
  miscCostsTotal?: number;
  deliveredCount?: number;
};

export function parseMeeshoCsv(csvText: string): {
  lines: ParsedOrderLine[];
  summary: ReportSummary;
} {
  const rows = parseCsvRowsFromText(csvText);
  const lines: ParsedOrderLine[] = rows.map((row) => {
    const saleAmount = parseNumber(
      pick(row, ["sale amount", "order amount", "revenue", "gross amount", "total"])
    );
    const shipping = parseNumber(pick(row, ["shipping", "shipping charge", "logistics"]));
    const commission = parseNumber(
      pick(row, ["commission", "marketplace fee", "platform fee", "meesho commission"])
    );
    const returnAmount = parseNumber(pick(row, ["return amount", "return charge", "refund"]));
    const rtoAmount = parseNumber(pick(row, ["rto amount", "rto loss", "rto charge"]));
    const gst = parseNumber(pick(row, ["gst", "tax", "gst amount"]));
    const status = (pick(row, ["status", "order status"]) ?? "").toLowerCase();
    const isReturn = status.includes("return") || returnAmount > 0;
    const isRto = status.includes("rto") || rtoAmount > 0;
    const qty = parseInt(pick(row, ["quantity", "qty"]) ?? "1", 10) || 1;
    const netProfit = saleAmount - shipping - commission - returnAmount - rtoAmount - gst;

    const dateStr = pick(row, ["order date", "date", "created at"]);
    const orderDate = dateStr ? new Date(dateStr) : undefined;

    const stateRaw = pick(row, [
      "state",
      "customer state",
      "ship state",
      "shipping state",
      "delivery state",
      "buyer state",
      "destination state",
      "ship to state",
      "billing state",
      "order state",
      "consignee state",
    ]);
    const pincodeRaw = pick(row, [
      "pincode",
      "pin code",
      "pin",
      "zip",
      "postal code",
      "ship to pincode",
      "shipping pincode",
      "delivery pincode",
    ]);

    return {
      orderId: pick(row, ["order id", "order_id", "sub order id"]),
      sku: pick(row, ["sku", "product sku", "style id"]),
      productName: pick(row, ["product name", "product", "title", "item name"]),
      quantity: qty,
      saleAmount,
      shipping,
      commission,
      returnAmount,
      rtoAmount,
      gst,
      netProfit,
      isReturn,
      isRto,
      orderDate: orderDate && !isNaN(orderDate.getTime()) ? orderDate : undefined,
      state: resolveOrderState(stateRaw, pincodeRaw),
      pincode: pincodeRaw?.replace(/\D/g, "").slice(0, 6) || undefined,
    };
  });

  const grossRevenue = lines.reduce((s, l) => s + l.saleAmount, 0);
  const shippingCharges = lines.reduce((s, l) => s + l.shipping, 0);
  const marketplaceCharges = lines.reduce((s, l) => s + l.commission, 0);
  const returnCharges = lines.reduce((s, l) => s + l.returnAmount, 0);
  const rtoLoss = lines.reduce((s, l) => s + l.rtoAmount, 0);
  const gstImpact = lines.reduce((s, l) => s + l.gst, 0);
  const netProfit = lines.reduce((s, l) => s + l.netProfit, 0);
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
  };

  return { lines, summary };
}

export function aggregateByState(lines: ParsedOrderLine[]): StateOrderStats[] {
  const map = new Map<string, StateOrderStats>();

  for (const line of lines) {
    const state = line.state ?? "Unknown";
    const existing = map.get(state) ?? {
      state,
      orderCount: 0,
      revenue: 0,
      returnCount: 0,
      rtoCount: 0,
      cancelledCount: 0,
    };
    existing.orderCount += 1;
    if (line.isCancelled || (line.orderStatus ?? "").toUpperCase().includes("CANCEL")) {
      existing.cancelledCount = (existing.cancelledCount ?? 0) + 1;
    } else {
      existing.revenue += line.saleAmount;
      if (line.isReturn) existing.returnCount += 1;
      if (line.isRto) existing.rtoCount += 1;
    }
    map.set(state, existing);
  }

  return [...map.values()].sort((a, b) => b.orderCount - a.orderCount);
}

export function aggregateBySku(lines: ParsedOrderLine[]) {
  const map = new Map<
    string,
    { sku: string; name: string; sales: number; profit: number; returns: number; count: number }
  >();

  for (const line of lines) {
    const key = line.sku ?? line.productName ?? "unknown";
    const existing = map.get(key) ?? {
      sku: key,
      name: line.productName ?? key,
      sales: 0,
      profit: 0,
      returns: 0,
      count: 0,
    };
    existing.sales += line.saleAmount;
    existing.profit += line.netProfit;
    existing.count += 1;
    if (line.isReturn) existing.returns += 1;
    map.set(key, existing);
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      returnRate: s.count ? (s.returns / s.count) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);
}
