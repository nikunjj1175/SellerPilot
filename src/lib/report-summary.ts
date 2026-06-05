import type { ReportSummary } from "@/lib/meesho-parser";

/** Apply wizard misc costs and report month onto parsed summary. */
export function finalizeReportSummary(
  summary: ReportSummary,
  opts?: { reportMonth?: string; miscCosts?: number }
): ReportSummary {
  const misc = Math.max(0, opts?.miscCosts ?? 0);
  const baseProfit = summary.profitBeforeCosts ?? summary.netProfit;

  return {
    ...summary,
    reportMonth: opts?.reportMonth,
    miscCostsTotal: misc,
    profitBeforeCosts: baseProfit,
    netProfit: baseProfit - misc,
  };
}
