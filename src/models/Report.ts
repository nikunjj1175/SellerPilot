import mongoose, { Schema, models, model } from "mongoose";
import type { Marketplace, ReportStatus, ReportType, UploadSource } from "@/types/enums";
import type { ReportSummary } from "@/lib/meesho-parser";
import type { AiInsightsResult } from "@/lib/ai-insights";

export interface IReport {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  marketplace: Marketplace;
  storeId?: mongoose.Types.ObjectId;
  uploadSource: UploadSource;
  type: ReportType;
  status: ReportStatus;
  blobUrl?: string;
  fileName?: string;
  creditsUsed: number;
  error?: string;
  summary?: ReportSummary;
  insights?: AiInsightsResult;
  insightsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    marketplace: {
      type: String,
      enum: ["MEESHO"],
      default: "MEESHO",
      index: true,
    },
    storeId: { type: Schema.Types.ObjectId, ref: "SellerStore", index: true },
    uploadSource: {
      type: String,
      enum: ["WEB", "API", "AGENCY"],
      default: "WEB",
    },
    type: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"],
      default: "CUSTOM",
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    blobUrl: String,
    fileName: String,
    creditsUsed: { type: Number, default: 0 },
    error: String,
    summary: Schema.Types.Mixed,
    insights: Schema.Types.Mixed,
    insightsAt: Date,
  },
  { timestamps: true }
);

export const Report = models.Report ?? model<IReport>("Report", ReportSchema);
