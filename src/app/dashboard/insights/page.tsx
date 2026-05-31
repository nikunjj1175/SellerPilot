import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { AiInsightsResult } from "@/lib/ai-insights";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const session = await requireSession();
  const { report: reportId } = await searchParams;

  await connectDB();
  const reports = await Report.find({
    userId: session.user.id,
    status: "COMPLETED",
  })
    .sort({ createdAt: -1 })
    .select("name insights")
    .lean<Pick<IReport, "name" | "insights" | "_id">[]>();

  const selected = reportId
    ? reports.find((r) => r._id.toString() === reportId) ?? reports[0]
    : reports[0];

  if (!reports.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Upload a completed report first.</p>
        <Link href="/dashboard/reports" className="text-primary hover:underline mt-2 inline-block">
          Go to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground">Smart recommendations from your seller data</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {reports.map((r) => (
          <Link
            key={r._id.toString()}
            href={`/dashboard/insights?report=${r._id.toString()}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              selected?._id.toString() === r._id.toString()
                ? "border-primary bg-primary/10 text-primary"
                : "border-border"
            }`}
          >
            {r.name}
          </Link>
        ))}
      </div>

      {selected && (
        <InsightsPanel
          reportId={selected._id.toString()}
          reportName={selected.name}
          insights={(selected.insights as AiInsightsResult | null) ?? null}
          credits={session.user.credits ?? 0}
        />
      )}
    </div>
  );
}
