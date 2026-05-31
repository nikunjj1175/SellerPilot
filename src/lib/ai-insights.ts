import { aggregateBySku, type ParsedOrderLine, type ReportSummary } from "@/lib/meesho-parser";
import { formatINR } from "@/lib/utils";

export type ProductInsight = {
  sku: string;
  name: string;
  type: "loss" | "high_return" | "high_rto" | "profitable" | "opportunity";
  metric: string;
  reason: string;
  recommendation: string;
};

export type AiInsightsResult = {
  generatedAt: string;
  summary: string;
  products: ProductInsight[];
  opportunities: string[];
};

export function generateInsights(
  lines: ParsedOrderLine[],
  summary: ReportSummary
): AiInsightsResult {
  const skus = aggregateBySku(lines);
  const products: ProductInsight[] = [];

  const lossMaking = skus.filter((s) => s.profit < 0).sort((a, b) => a.profit - b.profit);
  for (const s of lossMaking.slice(0, 5)) {
    products.push({
      sku: s.sku,
      name: s.name,
      type: "loss",
      metric: formatINR(s.profit),
      reason: `Net loss of ${formatINR(Math.abs(s.profit))} with ${s.returnRate.toFixed(1)}% return rate`,
      recommendation:
        s.returnRate > 20
          ? "Improve product images, sizing chart, and quality checks. Review pricing vs competitors."
          : "Review commission and shipping costs. Consider bundling or minimum order value.",
    });
  }

  const highReturn = skus
    .filter((s) => s.returnRate >= 15 && s.count >= 2)
    .sort((a, b) => b.returnRate - a.returnRate);
  for (const s of highReturn.slice(0, 5)) {
    if (products.some((p) => p.sku === s.sku && p.type === "loss")) continue;
    products.push({
      sku: s.sku,
      name: s.name,
      type: "high_return",
      metric: `${s.returnRate.toFixed(1)}% returns`,
      reason: `${s.returns} returns out of ${s.count} orders`,
      recommendation: "Add detailed size guide, real product photos, and review negative feedback patterns.",
    });
  }

  const rtoLines = lines.filter((l) => l.isRto);
  const rtoBySku = new Map<string, { count: number; loss: number; name: string }>();
  for (const l of rtoLines) {
    const key = l.sku ?? l.productName ?? "unknown";
    const e = rtoBySku.get(key) ?? { count: 0, loss: 0, name: l.productName ?? key };
    e.count += 1;
    e.loss += l.rtoAmount + l.shipping;
    rtoBySku.set(key, e);
  }
  const highRto = [...rtoBySku.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [sku, data] of highRto.slice(0, 5)) {
    products.push({
      sku,
      name: data.name,
      type: "high_rto",
      metric: `${data.count} RTO orders`,
      reason: `Estimated RTO loss ${formatINR(data.loss)}`,
      recommendation: "Verify pincode serviceability, COD confirmation calls, and packaging durability.",
    });
  }

  const profitable = skus.filter((s) => s.profit > 0).sort((a, b) => b.profit - a.profit);
  for (const s of profitable.slice(0, 3)) {
    products.push({
      sku: s.sku,
      name: s.name,
      type: "profitable",
      metric: formatINR(s.profit),
      reason: `Strong margin with ${s.returnRate.toFixed(1)}% return rate`,
      recommendation: "Scale inventory for this SKU. Consider running ads and creating variants.",
    });
  }

  const opportunities: string[] = [];
  if (summary.returnRate > 15) {
    opportunities.push(
      `Overall return rate is ${summary.returnRate.toFixed(1)}% — focus on top 3 return SKUs to improve net margin.`
    );
  }
  if (summary.rtoRate > 10) {
    opportunities.push(
      `RTO rate ${summary.rtoRate.toFixed(1)}% is above healthy benchmark (8%). Review COD orders and delivery partners.`
    );
  }
  if (summary.netProfit < 0) {
    opportunities.push(
      `Business is net negative (${formatINR(summary.netProfit)}). Pause loss-making SKUs and renegotiate shipping.`
    );
  } else if (summary.netProfit > 0) {
    opportunities.push(
      `Net profit ${formatINR(summary.netProfit)} is positive — reinvest in top ${Math.min(3, profitable.length)} profitable SKUs.`
    );
  }

  const marginPct =
    summary.grossRevenue > 0 ? (summary.netProfit / summary.grossRevenue) * 100 : 0;
  const summaryText = `Analyzed ${summary.totalOrders} orders. Revenue ${formatINR(summary.grossRevenue)}, net profit ${formatINR(summary.netProfit)} (${marginPct.toFixed(1)}% margin). Returns ${summary.returnRate.toFixed(1)}%, RTO ${summary.rtoRate.toFixed(1)}%.`;

  return {
    generatedAt: new Date().toISOString(),
    summary: summaryText,
    products: products.slice(0, 12),
    opportunities,
  };
}
