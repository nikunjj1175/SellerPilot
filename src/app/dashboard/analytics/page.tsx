import { redirectToReportTab } from "@/lib/report-redirect";

export default async function AnalyticsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("analytics", report);
}
