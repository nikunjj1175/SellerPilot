import type { ReportDetailData } from "@/lib/report-data";
import { ReportHub } from "@/components/report-hub/report-hub";

export function ReportDetailView({
  data,
  credits = 0,
  defaultTab,
}: {
  data: ReportDetailData;
  credits?: number;
  defaultTab?: string;
}) {
  return <ReportHub data={data} credits={credits} defaultTab={defaultTab} />;
}
