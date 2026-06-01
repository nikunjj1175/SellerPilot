"use client";

import { deleteReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { formatINR, formatPct } from "@/lib/utils";
import { addCalendarMonth, formatReportMonth } from "@/lib/report-month";
import type { ClientReport } from "@/types/report";
import type { ReportStatus } from "@/types/enums";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import Link from "next/link";
import type { ReportSummary } from "@/lib/meesho-parser";

const statusBadge: Record<ReportStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  PROCESSING: "bg-sky-50 text-sky-800 border-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-50 text-red-800 border-red-200",
};

function reportPeriodLabel(report: ClientReport) {
  const d = new Date(report.createdAt);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  return report.name;
}

function reportGeneratedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function prevMonthNewReportHref(report: ClientReport) {
  const d = new Date(report.createdAt);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const prev = addCalendarMonth(ym, -1);
  return `/dashboard/reports/new?month=${prev}`;
}

export function ReportsList({ reports }: { reports: ClientReport[] }) {
  const [pending, startTransition] = useTransition();
  const completed = reports.filter((r) => r.status === "COMPLETED");

  if (!reports.length) {
    return (
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-slate-600">Available Reports</h2>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
          <p className="text-slate-600 mb-4">No reports yet. Generate your first monthly P&L.</p>
          <Button className="rounded-xl" asChild>
            <Link href="/dashboard/reports/new">
              <Plus className="h-4 w-4 mr-1" />
              Generate New P&L Report
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">Available Reports</h2>
        <span className="text-xs text-muted-foreground">{completed.length} completed</span>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {reports.map((report, idx) => {
          const summary = report.summary as ReportSummary | null;
          const isCompleted = report.status === "COMPLETED" && summary;
          const sales =
            summary?.netTaxableSales ?? summary?.grossRevenueExGst ?? summary?.grossRevenue ?? 0;
          const netProfit = summary?.netProfit ?? 0;
          const lossSkus = summary?.lossSkuCount ?? 0;
          const rtoPct = summary?.rtoRate ?? 0;
          const returnPct = summary?.returnRate ?? 0;
          const period = reportPeriodLabel(report);

          return (
            <article
              key={report.id}
              className={`p-6 md:p-8 ${idx > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="flex flex-col xl:flex-row xl:items-center gap-8">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
                    Monthly P&L Report
                  </p>
                  <h3 className="font-display text-3xl md:text-[2rem] font-bold text-[#5b2d82] leading-none">
                    {period}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Generated {reportGeneratedAt(report.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[report.status]}`}
                    >
                      {report.status === "COMPLETED" ? "Completed" : report.status}
                    </span>
                    {isCompleted && (
                      <>
                        <span className="rounded-md border border-violet-200 bg-violet-50 text-violet-800 px-2 py-0.5 text-[11px] font-medium">
                          Full Report
                        </span>
                        <span className="rounded-md border border-violet-200/80 bg-violet-50/80 text-violet-700 px-2 py-0.5 text-[11px] font-medium">
                          1 month analysis
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isCompleted ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-xl">
                    {[
                      {
                        label: "Net Profit",
                        value: formatINR(netProfit),
                        valueClass:
                          netProfit >= 0
                            ? "text-emerald-600"
                            : "text-red-600",
                      },
                      {
                        label: "Sales",
                        value: formatINR(sales),
                        valueClass: "text-slate-800",
                      },
                      {
                        label: "Loss SKUs",
                        value: String(lossSkus),
                        valueClass: lossSkus > 0 ? "text-red-600" : "text-slate-800",
                      },
                      {
                        label: "RTO / Returns",
                        value: `${formatPct(rtoPct)} / ${formatPct(returnPct)}`,
                        valueClass: "text-slate-800 text-sm md:text-base",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-3 text-center min-h-[72px] flex flex-col justify-center"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
                          {m.label}
                        </p>
                        <p className={`font-bold text-lg mt-1 tabular-nums ${m.valueClass}`}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : report.error ? (
                  <p className="text-sm text-red-600 flex-1">{report.error}</p>
                ) : (
                  <p className="text-sm text-slate-500 animate-pulse flex-1">Processing…</p>
                )}

                <div className="flex flex-col items-stretch xl:items-end gap-2 shrink-0 w-full xl:w-[220px]">
                  {isCompleted && (
                    <>
                      <Button
                        className="rounded-xl h-12 w-full font-semibold text-base shadow-sm bg-[#5b2d82] hover:bg-[#4a2469]"
                        asChild
                      >
                        <Link href={`/dashboard/reports/${report.id}`}>Open P&L Report</Link>
                      </Button>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <a
                          href={`/api/reports/${report.id}/export?format=pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          Download PDF
                        </a>
                        <Link
                          href={prevMonthNewReportHref(report)}
                          className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition leading-tight"
                        >
                          Generate{" "}
                          {formatReportMonth(
                            addCalendarMonth(
                              `${new Date(report.createdAt).getFullYear()}-${String(new Date(report.createdAt).getMonth() + 1).padStart(2, "0")}`,
                              -1
                            )
                          )}
                        </Link>
                      </div>
                      <p className="text-[10px] text-slate-400 text-right w-full pt-1">
                        Add previous month to compare trends
                      </p>
                      <div className="flex justify-end gap-3 text-[11px] w-full">
                        <Link
                          href={`/dashboard/product-costs?report=${report.id}`}
                          className="text-[#5b2d82] hover:underline"
                        >
                          Edit SKU Costs
                        </Link>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-600"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await deleteReport(report.id);
                              if (res.error) toast.error(res.error);
                              else toast.success("Report deleted");
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ReportsPageHeader() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-1">
      <div>
        <h1 className="font-display text-2xl md:text-[1.75rem] font-bold text-slate-900 tracking-tight">
          Your Reports
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Access your monthly P&L statements and request past data.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50 h-10"
          asChild
        >
          <Link href="/demo-report">View Sample Report</Link>
        </Button>
        <Button
          className="rounded-xl h-10 px-4 font-semibold shadow-sm bg-[#5b2d82] hover:bg-[#4a2469] text-white"
          asChild
        >
          <Link href="/dashboard/reports/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Generate New P&L Report
          </Link>
        </Button>
      </div>
    </header>
  );
}
