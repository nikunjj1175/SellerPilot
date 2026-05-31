"use client";

import { deleteReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { formatINR, formatPct } from "@/lib/utils";
import type { ClientReport } from "@/types/report";
import type { ReportStatus } from "@/types/enums";
import { Trash2, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import Link from "next/link";
import type { ReportSummary } from "@/lib/meesho-parser";

const statusBadge: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

export function ReportsList({ reports }: { reports: ClientReport[] }) {
  const [pending, startTransition] = useTransition();
  const completed = reports.filter((r) => r.status === "COMPLETED");

  if (!reports.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 bg-card p-12 text-center space-y-4">
        <p className="text-muted-foreground">No reports yet. Upload your Meesho files above.</p>
        <Link href="/demo-report" className="text-primary font-medium hover:underline text-sm">
          Demo report joi lo (free) →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Available Reports</h2>
        <span className="text-xs text-muted-foreground">{completed.length} completed</span>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        {reports.map((report, idx) => {
          const summary = report.summary as ReportSummary | null;
          const isCompleted = report.status === "COMPLETED" && summary;
          const sales =
            summary?.netTaxableSales ?? summary?.grossRevenueExGst ?? summary?.grossRevenue ?? 0;
          const netProfit = summary?.netProfit ?? 0;
          const lossSkus = summary?.lossSkuCount ?? 0;
          const rtoPct = summary?.rtoRate ?? 0;
          const returnPct = summary?.returnRate ?? 0;
          const monthLabel = new Date(report.createdAt).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });

          return (
            <div
              key={report.id}
              className={`p-5 md:p-6 ${idx > 0 ? "border-t border-border/60" : ""}`}
            >
              <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Monthly P&L Report
                  </p>
                  <h3 className="font-display text-xl font-bold">{report.name || monthLabel}</h3>
                  <p className="text-xs text-muted-foreground">
                    Generated{" "}
                    {new Date(report.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge[report.status]}`}
                    >
                      {report.status === "COMPLETED" ? "Completed" : report.status}
                    </span>
                    {isCompleted && (
                      <>
                        <span className="rounded-full border border-primary/40 text-primary px-2.5 py-0.5 text-xs font-medium">
                          Full Report
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                          Meesho · {report.creditsUsed} credits
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isCompleted ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    {[
                      {
                        label: "Net Profit",
                        value: formatINR(netProfit),
                        className: netProfit >= 0 ? "text-emerald-600" : "text-red-500",
                      },
                      { label: "Sales", value: formatINR(sales), className: "" },
                      {
                        label: "Loss SKUs",
                        value: String(lossSkus),
                        className: lossSkus > 0 ? "text-red-500" : "",
                      },
                      {
                        label: "RTO / Returns",
                        value: `${formatPct(rtoPct)} / ${formatPct(returnPct)}`,
                        className: "text-sm",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-center"
                      >
                        <p className="text-[10px] uppercase text-muted-foreground font-medium">
                          {m.label}
                        </p>
                        <p className={`font-display font-bold text-lg mt-1 ${m.className}`}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : report.error ? (
                  <p className="text-sm text-red-500 flex-1">{report.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground animate-pulse flex-1">Processing…</p>
                )}

                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 min-w-[180px]">
                  {isCompleted && (
                    <>
                      <Button className="rounded-xl shadow-md w-full sm:w-auto" asChild>
                        <Link href={`/dashboard/reports/${report.id}`}>Open P&L Report</Link>
                      </Button>
                      <div className="flex flex-wrap gap-3 text-xs justify-end">
                        <Link
                          href={`/dashboard/product-costs?report=${report.id}`}
                          className="text-primary hover:underline"
                        >
                          Edit SKU Costs
                        </Link>
                        <a
                          href={`/api/reports/${report.id}/export?format=pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Download PDF
                        </a>
                        <a
                          href={`/api/reports/${report.id}/export?format=excel`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <FileSpreadsheet className="h-3 w-3 inline mr-0.5" />
                          Excel
                        </a>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">
                        Add product costs for true net profit
                      </p>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 self-end"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await deleteReport(report.id);
                        if (res.error) toast.error(res.error);
                        else toast.success("Report deleted");
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportsPageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Your Reports</h1>
        <p className="text-muted-foreground mt-1">
          Access your monthly P&L statements and manage product costs.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/demo-report">View Sample Report</Link>
        </Button>
        <Button className="rounded-xl shadow-md" asChild>
          <Link href="#upload">
            <Plus className="h-4 w-4 mr-1" />
            Generate New P&L Report
          </Link>
        </Button>
      </div>
    </div>
  );
}
