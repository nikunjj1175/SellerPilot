import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getUserCompletedReports } from "@/lib/report-data";

const TAB_MAP: Record<string, string> = {
  analytics: "metrics",
  states: "state-spread",
  sku: "sku-ranking",
  returns: "status-mix",
  rto: "status-mix",
  insights: "ask-ai",
};

export async function redirectToReportTab(
  tabKey: keyof typeof TAB_MAP,
  reportId?: string
) {
  const session = await requireSession();
  const tab = TAB_MAP[tabKey] ?? "overview";

  if (reportId) {
    redirect(`/dashboard/reports/${reportId}?tab=${tab}`);
  }

  const reports = await getUserCompletedReports(session.user.id);
  const latest = reports[0];
  if (latest) {
    redirect(`/dashboard/reports/${latest._id.toString()}?tab=${tab}`);
  }

  redirect(`/demo-report?tab=${tab}`);
}
