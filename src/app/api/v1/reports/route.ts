import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { authenticateApiKey } from "@/lib/api-auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/security";
import { connectDB } from "@/lib/mongodb";
import { Report, type IReport } from "@/models/Report";
import { processReportJob } from "@/lib/report-processor";
import type { Marketplace, ReportType } from "@/types/enums";

export async function GET(req: Request) {
  const authResult = await authenticateApiKey(req.headers.get("authorization"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const limited = checkRateLimit(`apikey:${authResult.apiKey._id.toString()}`, 100, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  await connectDB();
  const reports = await Report.find({ userId: authResult.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("name marketplace status summary createdAt creditsUsed")
    .lean<
      (Pick<
        IReport,
        "name" | "marketplace" | "status" | "summary" | "createdAt" | "creditsUsed"
      > & { _id: mongoose.Types.ObjectId })[]
    >();

  return NextResponse.json({
    credits: authResult.user.credits,
    reports: reports.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      marketplace: r.marketplace,
      status: r.status,
      summary: r.summary,
      createdAt: r.createdAt,
      creditsUsed: r.creditsUsed,
    })),
  });
}

export async function POST(req: Request) {
  const authResult = await authenticateApiKey(req.headers.get("authorization"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const limited = checkRateLimit(`apikey-post:${authResult.apiKey._id.toString()}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const marketplace = ((formData.get("marketplace") as string) || "MEESHO") as Marketplace;
  const reportType = ((formData.get("type") as string) || "CUSTOM") as ReportType;
  const reportName =
    (formData.get("name") as string) || file?.name || `${marketplace} API Report`;
  const storeId = formData.get("storeId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file field required (CSV)" }, { status: 400 });
  }

  const creditCost = 2;
  if (authResult.user.credits < creditCost) {
    return NextResponse.json(
      { error: `Insufficient credits. Need ${creditCost}, have ${authResult.user.credits}` },
      { status: 402 }
    );
  }

  await connectDB();
  const report = await Report.create({
    userId: authResult.user._id,
    name: reportName,
    marketplace,
    type: reportType,
    status: "PROCESSING",
    fileName: file.name,
    creditsUsed: creditCost,
    uploadSource: "API",
    storeId: storeId ? new mongoose.Types.ObjectId(storeId) : undefined,
  });

  const reportId = report._id.toString();
  const csvText = await file.text();

  try {
    await processReportJob({
      reportId,
      userId: authResult.user._id.toString(),
      csvText,
      fileName: file.name,
      creditCost,
      marketplace,
      storeBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });

    const { User } = await import("@/models");
    const updatedUser = await User.findById(authResult.user._id).select("credits");
    const completed = await Report.findById(reportId).lean<IReport>();

    return NextResponse.json({
      success: true,
      reportId,
      status: completed?.status,
      summary: completed?.summary,
      creditsRemaining: updatedUser?.credits ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed", reportId },
      { status: 500 }
    );
  }
}
