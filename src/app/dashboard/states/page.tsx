import { redirectToReportTab } from "@/lib/report-redirect";

export default async function StatesRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("states", report);
}
