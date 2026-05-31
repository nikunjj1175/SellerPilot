"use client";

import { deleteReport } from "@/app/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { ClientReport } from "@/types/report";
import type { ReportStatus } from "@/types/enums";
import { ReportNotifyButtons } from "@/components/dashboard/report-notify-buttons";
import { Trash2, Download, FileSpreadsheet, FileText, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import Link from "next/link";
import type { ReportSummary } from "@/lib/meesho-parser";

const statusColors: Record<ReportStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  PROCESSING: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  FAILED: "bg-red-500/10 text-red-600",
};

export function ReportsList({ reports }: { reports: ClientReport[] }) {
  const [pending, startTransition] = useTransition();

  if (!reports.length) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">No reports yet. Upload your first CSV above.</p>
          <p className="text-sm text-muted-foreground">
            Pahela idea joie?{" "}
            <Link href="/demo-report" className="text-primary font-medium hover:underline">
              Demo report joi lo (free)
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const summary = report.summary as ReportSummary | null;
        return (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-base">{report.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {report.marketplace} · {new Date(report.createdAt).toLocaleString("en-IN")} ·{" "}
                  {report.creditsUsed} credits
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}>
                {report.status}
              </span>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              {summary && report.status === "COMPLETED" ? (
                <div className="flex gap-6 text-sm">
                  <span>Revenue: {formatINR(summary.grossRevenue)}</span>
                  <span className={summary.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
                    Profit: {formatINR(summary.netProfit)}
                  </span>
                </div>
              ) : report.error ? (
                <p className="text-sm text-red-500">{report.error}</p>
              ) : null}
              <div className="flex gap-2">
                {report.status === "COMPLETED" && (
                  <>
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/dashboard/reports/${report.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/analytics?report=${report.id}`}>P&L</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/insights?report=${report.id}`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/reports/${report.id}/export?format=excel`}>
                        <FileSpreadsheet className="h-3 w-3 mr-1" />
                        Excel
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/reports/${report.id}/export?format=pdf`} target="_blank">
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
                      </a>
                    </Button>
                    <ReportNotifyButtons reportId={report.id} />
                  </>
                )}
                {report.status === "PROCESSING" && (
                  <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
                )}
                {report.blobUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={report.blobUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteReport(report.id);
                      if (res.error) toast.error(res.error);
                      else toast.success("Report deleted");
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
