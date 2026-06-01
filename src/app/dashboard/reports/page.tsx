import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { ReportsList, ReportsPageHeader } from "@/components/dashboard/reports-list";
import { serializeReport } from "@/lib/serialize";

export default async function ReportsPage() {
  const session = await requireSession();
  await connectDB();

  const reports = await Report.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean<IReport[]>();

  return (
    <div className="mx-auto max-w-6xl">
      <ReportsPageHeader />
      <ReportsList reports={reports.map((r) => serializeReport(r))} />
    </div>
  );
}
