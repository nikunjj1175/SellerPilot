import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getReportDetail, getUserCompletedReports } from "@/lib/report-data";
import { ReportDetailView } from "@/components/dashboard/report-detail-view";
import { ReportPicker } from "@/components/dashboard/report-picker";
import Link from "next/link";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { tab } = await searchParams;

  const [data, reports] = await Promise.all([
    getReportDetail(session.user.id, id),
    getUserCompletedReports(session.user.id),
  ]);

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <ReportPicker
        reports={reports.map((r) => ({ id: r._id.toString(), name: r.name }))}
        selectedId={id}
        basePath="/dashboard/reports"
        linkMode="path"
      />
      <ReportDetailView data={data} credits={session.user.credits ?? 0} defaultTab={tab} />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard/reports" className="text-primary hover:underline">
          ← Back to all reports
        </Link>
      </p>
    </div>
  );
}
