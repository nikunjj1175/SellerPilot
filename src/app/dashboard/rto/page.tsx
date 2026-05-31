import { redirectToReportTab } from "@/lib/report-redirect";

export default async function RtoRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("rto", report);
}
