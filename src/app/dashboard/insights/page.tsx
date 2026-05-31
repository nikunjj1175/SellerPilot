import { redirectToReportTab } from "@/lib/report-redirect";

export default async function InsightsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("insights", report);
}
