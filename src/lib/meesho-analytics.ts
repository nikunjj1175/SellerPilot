import type { ParsedOrderLine, ReportSummary, StateOrderStats } from "@/lib/meesho-parser";
import { aggregateByState } from "@/lib/meesho-parser";

export type StatusFilter =
  | "ALL"
  | "DELIVERED"
  | "RTO"
  | "RETURN"
  | "CANCELLED"
  | "EXCHANGE"
  | "LOST";

export type MeeshoReportAnalytics = {
  hero: {
    netProfit: number;
    marginPct: number;
    avgPerOrder: number;
    totalPayout: number;
    netOrders: number;
    grossOrders: number;
    cancelled: number;
    deliveredRows: number;
    deliveredPct: number;
    lossSkus: number;
    skuCount: number;
  };
  statusMix: { label: string; count: number; pct: number; color: string }[];
  skuSnapshot: {
    total: number;
    profit: number;
    loss: number;
    nearZero: number;
  };
  gstBreakdown: {
    outputGst: number;
    returnGst: number;
    netGst: number;
    gstCollected: number;
  };
  dailyTrend: { date: string; orders: number; sales: number; profit: number }[];
  skuRanking: {
    topProfit: SkuRankRow[];
    topLoss: SkuRankRow[];
  };
  actionPlan: ActionRow[];
  monthlyMetrics: { label: string; value: string; sub?: string }[];
};

export type SkuRankRow = {
  sku: string;
  name: string;
  sales: number;
  profit: number;
  marginPct: number;
  returnPct: number;
  action: "Scale" | "Fix Price" | "Stop / Fix First" | "Watch";
};

export type ActionRow = {
  priority: number;
  sku: string;
  action: string;
  netResult: number;
  marginPct: number;
  returnPct: number;
  why: string;
  badge: "danger" | "warning" | "success";
};

function normalizeStatus(raw?: string): string {
  const s = (raw ?? "UNKNOWN").toUpperCase();
  if (s.includes("RTO")) return "RTO";
  if (s.includes("EXCHANGE")) return "EXCHANGE";
  if (s.includes("RETURN") && !s.includes("RTO")) return "RETURN";
  if (s === "CANCELLED" || s.includes("CANCEL")) return "CANCELLED";
  if (s === "LOST") return "LOST";
  if (s === "DELIVERED") return "DELIVERED";
  if (s.includes("SHIP")) return "SHIPPED";
  return s;
}

export function filterLinesByStatus(lines: ParsedOrderLine[], filter: StatusFilter) {
  if (filter === "ALL") return lines;
  return lines.filter((l) => {
    const s = normalizeStatus(l.orderStatus);
    if (filter === "RTO") return s === "RTO" || l.isRto;
    if (filter === "RETURN") return s === "RETURN" || l.isReturn;
    if (filter === "DELIVERED") return s === "DELIVERED";
    if (filter === "CANCELLED") return s === "CANCELLED";
    if (filter === "EXCHANGE") return s === "EXCHANGE";
    if (filter === "LOST") return s === "LOST";
    return true;
  });
}

export function statesForFilter(lines: ParsedOrderLine[], filter: StatusFilter): StateOrderStats[] {
  return aggregateByState(filterLinesByStatus(lines, filter));
}

export function buildMeeshoAnalytics(
  lines: ParsedOrderLine[],
  summary: ReportSummary,
  orderRowCount?: number
): MeeshoReportAnalytics {
  const grossOrders = orderRowCount ?? lines.length;
  const statusCounts = new Map<string, number>();

  for (const line of lines) {
    const s = normalizeStatus(line.orderStatus);
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
  }

  const cancelled = statusCounts.get("CANCELLED") ?? 0;
  const deliveredRows = statusCounts.get("DELIVERED") ?? 0;
  const rtoRows = statusCounts.get("RTO") ?? lines.filter((l) => l.isRto).length;
  const returnRows = statusCounts.get("RETURN") ?? lines.filter((l) => l.isReturn).length;
  const exchangeRows = statusCounts.get("EXCHANGE") ?? 0;
  const lostRows = statusCounts.get("LOST") ?? 0;

  const totalPayout = lines.reduce((s, l) => s + (l.supplierPrice ?? l.saleAmount), 0);
  const netProfit = summary.netProfit;
  const netTaxable = summary.netTaxableSales ?? summary.grossRevenue - summary.returnCharges;
  const marginPct = netTaxable > 0 ? (netProfit / netTaxable) * 100 : 0;
  const netOrders = grossOrders - cancelled;
  const avgPerOrder = netOrders > 0 ? netProfit / netOrders : 0;

  const statusMix = [
    { label: "Delivered", count: deliveredRows, color: "#10b981" },
    { label: "RTO", count: rtoRows, color: "#f97316" },
    { label: "Return", count: returnRows, color: "#ef4444" },
    { label: "Cancelled", count: cancelled, color: "#a855f7" },
    { label: "Exchange", count: exchangeRows, color: "#3b82f6" },
    { label: "Lost", count: lostRows, color: "#64748b" },
  ]
    .filter((x) => x.count > 0)
    .map((x) => ({
      ...x,
      pct: grossOrders ? (x.count / grossOrders) * 100 : 0,
    }));

  const skuMap = new Map<
    string,
    { sku: string; name: string; sales: number; profit: number; returns: number; count: number }
  >();

  for (const line of lines) {
    const key = line.sku ?? line.productName ?? "unknown";
    const existing = skuMap.get(key) ?? {
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
    if (line.isReturn || normalizeStatus(line.orderStatus) === "RETURN") existing.returns += 1;
    skuMap.set(key, existing);
  }

  const skuRows = [...skuMap.values()];
  const profitSkus = skuRows.filter((s) => s.profit > 1).length;
  const lossSkus = skuRows.filter((s) => s.profit < -1).length;
  const nearZero = skuRows.filter((s) => Math.abs(s.profit) <= 1).length;

  const toRank = (s: (typeof skuRows)[0]): SkuRankRow => ({
    sku: s.sku,
    name: s.name,
    sales: s.sales,
    profit: s.profit,
    marginPct: s.sales ? (s.profit / s.sales) * 100 : 0,
    returnPct: s.count ? (s.returns / s.count) * 100 : 0,
    action:
      s.profit > 500 ? "Scale" : s.profit < -500 ? "Stop / Fix First" : s.profit < 0 ? "Fix Price" : "Watch",
  });

  const topProfit = [...skuRows].sort((a, b) => b.profit - a.profit).slice(0, 10).map(toRank);
  const topLoss = [...skuRows].sort((a, b) => a.profit - b.profit).slice(0, 10).map(toRank);

  const actionPlan: ActionRow[] = [...skuRows]
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 15)
    .map((s, i) => {
      const rank = toRank(s);
      return {
        priority: i + 1,
        sku: s.sku,
        action: rank.action,
        netResult: s.profit,
        marginPct: rank.marginPct,
        returnPct: rank.returnPct,
        why:
          s.profit < 0
            ? "Net result is negative. Recheck selling price, product cost and return rate."
            : "Monitor margin and return % before scaling.",
        badge: s.profit < -500 ? "danger" : s.profit < 0 ? "warning" : "success",
      };
    });

  const dayMap = new Map<string, { orders: number; sales: number; profit: number }>();
  for (const line of lines) {
    if (!line.orderDate) continue;
    const key = line.orderDate.toISOString().slice(0, 10);
    const d = dayMap.get(key) ?? { orders: 0, sales: 0, profit: 0 };
    d.orders += 1;
    d.sales += line.saleAmount;
    d.profit += line.netProfit;
    dayMap.set(key, d);
  }

  const dailyTrend = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const outputGst = summary.gstCollected ?? summary.gstImpact;
  const returnGst = summary.gstReturnTotal ?? summary.returnCharges;

  return {
    hero: {
      netProfit,
      marginPct,
      avgPerOrder,
      totalPayout,
      netOrders,
      grossOrders,
      cancelled,
      deliveredRows,
      deliveredPct: grossOrders ? (deliveredRows / grossOrders) * 100 : 0,
      lossSkus,
      skuCount: skuRows.length,
    },
    statusMix,
    skuSnapshot: { total: skuRows.length, profit: profitSkus, loss: lossSkus, nearZero },
    gstBreakdown: {
      outputGst,
      returnGst,
      netGst: outputGst,
      gstCollected: outputGst,
    },
    dailyTrend,
    skuRanking: { topProfit, topLoss },
    actionPlan,
    monthlyMetrics: [
      { label: "Gross Orders", value: String(grossOrders), sub: `${dailyTrend.length} active days` },
      { label: "Cancelled", value: String(cancelled), sub: `Net Orders: ${netOrders}` },
      {
        label: "RTO %",
        value: `${((rtoRows / grossOrders) * 100).toFixed(2)}%`,
        sub: `RTO Qty: ${rtoRows}`,
      },
      {
        label: "Customer Return %",
        value: `${((returnRows / grossOrders) * 100).toFixed(2)}%`,
        sub: `Return Qty: ${returnRows}`,
      },
      { label: "Total Payout", value: `₹${totalPayout.toFixed(2)}`, sub: "Supplier price from orders" },
      {
        label: "GST Sale (ex-GST)",
        value: `₹${(summary.grossRevenueExGst ?? summary.grossRevenue).toFixed(2)}`,
        sub: "From tcs_sales.xlsx",
      },
      {
        label: "GST Returns",
        value: `₹${returnGst.toFixed(2)}`,
        sub: "From tcs_sales_return.xlsx",
      },
      {
        label: "Net Taxable Sales",
        value: `₹${netTaxable.toFixed(2)}`,
        sub: "Sale − Returns (ex-GST)",
      },
      {
        label: "Shipping (ex-GST)",
        value: `₹${(summary.shippingExGst ?? summary.shippingCharges).toFixed(2)}`,
      },
      { label: "Net Profit (ex-GST)", value: `₹${netProfit.toFixed(2)}`, sub: "After shipping" },
      {
        label: "GST Collected",
        value: `₹${outputGst.toFixed(2)}`,
        sub: "Informational — not deducted from profit",
      },
    ],
  };
}
