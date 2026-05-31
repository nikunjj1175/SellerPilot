import { redirectToReportTab } from "@/lib/report-redirect";

export default async function SkuRedirect({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  const { report } = await searchParams;
  await redirectToReportTab("sku", report);
}
