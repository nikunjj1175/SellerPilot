import { redirectToReportTab } from "@/lib/report-redirect";

export default async function ReturnsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("returns", report);
}
