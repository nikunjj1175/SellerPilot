import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { User, type IUser } from "@/models/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminReportActions } from "@/components/admin/report-actions";
import { formatINR } from "@/lib/utils";
import type { ReportSummary } from "@/lib/meesho-parser";

export default async function AdminReportsPage() {
  await connectDB();

  const reports = await Report.find().sort({ createdAt: -1 }).limit(50).lean<IReport[]>();
  const userIds = [...new Set(reports.map((r) => r.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select("email name").lean<IUser[]>();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Report Logs</h1>
      <div className="space-y-3">
        {reports.map((r) => {
          const s = r.summary as ReportSummary | undefined;
          const u = userMap[r.userId.toString()];
          return (
            <Card key={r._id.toString()}>
              <CardHeader className="flex flex-row justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {u?.email ?? "—"} · {new Date(r.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-xs font-medium">{r.status}</span>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                {s && (
                  <span className="text-sm">
                    {formatINR(s.grossRevenue)} → {formatINR(s.netProfit)}
                  </span>
                )}
                <AdminReportActions reportId={r._id.toString()} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
