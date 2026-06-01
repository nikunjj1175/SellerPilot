import type { Marketplace, ReportStatus, ReportType, UploadSource } from "@/types/enums";
import type { ReportSummary } from "@/lib/meesho-parser";
import type { AiInsightsResult } from "@/lib/ai-insights";

export type ClientReport = {
  id: string;
  userId: string;
  name: string;
  marketplace: Marketplace;
  uploadSource?: UploadSource;
  type: ReportType;
  status: ReportStatus;
  blobUrl?: string;
  fileName?: string;
  creditsUsed: number;
  error?: string;
  summary?: ReportSummary;
  insights?: AiInsightsResult;
  insightsAt?: string;
  createdAt: string;
  updatedAt: string;
};
