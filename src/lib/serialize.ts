import type { IReport } from "@/models/Report";
import type { ClientReport } from "@/types/report";

export function toId(doc: { _id?: { toString(): string }; id?: string }) {
  return doc.id ?? doc._id?.toString() ?? "";
}

export function serializeReport(doc: IReport): ClientReport {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    marketplace: doc.marketplace ?? "MEESHO",
    storeId: doc.storeId?.toString(),
    uploadSource: doc.uploadSource ?? "WEB",
    type: doc.type,
    status: doc.status,
    blobUrl: doc.blobUrl,
    fileName: doc.fileName,
    creditsUsed: doc.creditsUsed,
    error: doc.error,
    summary: doc.summary,
    insights: doc.insights,
    insightsAt: doc.insightsAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
