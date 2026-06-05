import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { User, type IUser } from "@/models/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminReportActions } from "@/components/admin/report-actions";
import { formatINR } from "@/lib/utils";
import type { ReportSummary } from "@/lib/meesho-parser";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BarChart3, User as UserIcon } from "lucide-react";

export default async function AdminReportsPage() {
  await connectDB();

  const reports = await Report.find().sort({ createdAt: -1 }).limit(80).lean<IReport[]>();
  const userIds = [...new Set(reports.map((r) => r.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select("email name suspended").lean<IUser[]>();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description={`User-wise P&L uploads — ${reports.length} recent`}
      />

      <div className="space-y-3">
        {reports.map((r) => {
          const s = r.summary as ReportSummary | undefined;
          const u = userMap[r.userId.toString()];
          return (
            <Card key={r._id.toString()} className="rounded-2xl border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold truncate">{r.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="h-3.5 w-3.5" />
                      {u?.name ?? u?.email ?? "Unknown user"}
                      {u?.suspended ? " (suspended)" : ""}
                    </span>
                    <span>·</span>
                    <span>{u?.email}</span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleString("en-IN")}</span>
                    {r.reportMonth && (
                      <>
                        <span>·</span>
                        <span className="text-primary font-medium">{r.reportMonth}</span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : "bg-violet-100 text-violet-800"
                  }`}
                >
                  {r.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {s && r.status === "COMPLETED" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center">
                    {[
                      { label: "Net profit", value: formatINR(s.netProfit) },
                      { label: "Net orders", value: String(s.netOrders ?? s.totalOrders) },
                      { label: "Delivered", value: String(s.deliveredCount ?? "—") },
                      { label: "RTO", value: String(s.rtoCount) },
                      { label: "Cancelled", value: String(s.cancelledCount ?? 0) },
                      { label: "Returns", value: String(s.returnCount) },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg border border-border bg-muted/40 px-2 py-2"
                      >
                        <p className="text-[10px] uppercase text-muted-foreground">{m.label}</p>
                        <p className="text-sm font-semibold mt-0.5 tabular-nums">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {s && (
                    <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Sales {formatINR(s.grossRevenueExGst ?? s.grossRevenue)} → Net{" "}
                      {formatINR(s.netProfit)}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <AdminReportActions reportId={r._id.toString()} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!reports.length && (
          <p className="text-center text-muted-foreground py-12">No reports yet.</p>
        )}
      </div>
    </div>
  );
}
