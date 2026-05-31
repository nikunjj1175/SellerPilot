"use server";

import { put } from "@vercel/blob";
import { after } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Report, OrderLine, CreditTransaction } from "@/models";
import { CREDIT_COSTS } from "@/lib/credits";
import { LARGE_CSV_BYTES, processReportJob } from "@/lib/report-processor";
import { enqueueReportProcessing, isQueueConfigured } from "@/lib/queue";
import type { Marketplace, ReportType } from "@/types/enums";
import type { ReportSummary } from "@/lib/meesho-parser";
import { revalidatePath } from "next/cache";

function getCreditCost(reportType: ReportType) {
  switch (reportType) {
    case "MONTHLY":
      return CREDIT_COSTS.MONTHLY_REPORT;
    case "QUARTERLY":
      return CREDIT_COSTS.QUARTERLY_REPORT;
    case "YEARLY":
      return CREDIT_COSTS.YEARLY_REPORT;
    default:
      return CREDIT_COSTS.MONTHLY_REPORT;
  }
}

export async function uploadAndProcessReport(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please sign in first." };
  }

  const marketplace = ((formData.get("marketplace") as string) || "MEESHO") as Marketplace;
  const reportName = (formData.get("name") as string) || `${marketplace} Report`;
  const reportType = ((formData.get("type") as string) || "CUSTOM") as ReportType;

  const ordersFile = formData.get("ordersFile") as File | null;
  const gstSaleFile = formData.get("gstSaleFile") as File | null;
  const gstReturnFile = formData.get("gstReturnFile") as File | null;
  const legacyFile = formData.get("file") as File | null;

  const isMeeshoMulti =
    marketplace === "MEESHO" && ordersFile && ordersFile.size > 0 && gstSaleFile && gstSaleFile.size > 0;

  const file = legacyFile && legacyFile.size > 0 ? legacyFile : ordersFile;

  if (!isMeeshoMulti && (!file || file.size === 0)) {
    if (marketplace === "MEESHO") {
      return { error: "Upload Meesho Orders Excel + GST Sale Excel (and optional GST Return)." };
    }
    return { error: "Please upload a CSV or Excel file." };
  }

  const creditCost = getCreditCost(reportType);

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || user.credits < creditCost) {
    return { error: `Not enough credits. This report needs ${creditCost} credits.` };
  }

  const storeIdRaw = formData.get("storeId") as string | null;
  const storeId = storeIdRaw ? new mongoose.Types.ObjectId(storeIdRaw) : undefined;

  const displayName =
    reportName !== `${marketplace} Report`
      ? reportName
      : isMeeshoMulti
        ? `Meesho P&L — ${ordersFile!.name.replace(/\.[^.]+$/, "")}`
        : file!.name;

  const report = await Report.create({
    userId: user._id,
    name: displayName,
    marketplace,
    type: reportType,
    status: "PROCESSING",
    fileName: isMeeshoMulti
      ? `${ordersFile!.name} + ${gstSaleFile!.name}`
      : file!.name,
    creditsUsed: creditCost,
    storeId,
    uploadSource: storeId ? "AGENCY" : "WEB",
  });

  const reportId = report._id.toString();

  let csvText = "";
  let meeshoFiles: import("@/lib/report-processor").MeeshoFilePayload | undefined;

  if (isMeeshoMulti) {
    meeshoFiles = {
      ordersFileName: ordersFile!.name,
      gstSaleFileName: gstSaleFile!.name,
      gstReturnFileName: gstReturnFile?.size ? gstReturnFile.name : undefined,
      ordersBuffer: await ordersFile!.arrayBuffer(),
      gstSaleBuffer: await gstSaleFile!.arrayBuffer(),
      gstReturnBuffer: gstReturnFile?.size ? await gstReturnFile.arrayBuffer() : undefined,
    };
    csvText = `[meesho-multi:${ordersFile!.name}]`;
  } else {
    csvText = await file!.text();
  }

  const isLarge =
    !isMeeshoMulti &&
    (file!.size >= LARGE_CSV_BYTES || csvText.split("\n").length > 2000);

  try {
    if (isLarge && isQueueConfigured() && process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`reports/${session.user.id}/${reportId}-${file!.name}`, csvText, {
        access: "public",
        addRandomSuffix: false,
      });

      await enqueueReportProcessing({
        reportId,
        userId: session.user.id,
        creditCost,
        reportName: displayName,
        blobUrl: blob.url,
        fileName: file!.name,
      });

      revalidatePath("/dashboard/reports");
      return {
        success: true,
        reportId,
        queued: true,
        message: "Large file queued for background processing.",
      };
    }

    if (isLarge) {
      after(async () => {
        await processReportJob({
          reportId,
          userId: session.user.id,
          csvText,
          fileName: file!.name,
          creditCost,
          marketplace,
          storeBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        });
      });

      revalidatePath("/dashboard/reports");
      return {
        success: true,
        reportId,
        queued: true,
        message: "Processing in background. Refresh in a few seconds.",
      };
    }

    await processReportJob({
      reportId,
      userId: session.user.id,
      csvText,
      fileName: isMeeshoMulti ? ordersFile!.name : file!.name,
      creditCost,
      marketplace,
      storeBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      meeshoFiles,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/states");
    revalidatePath("/dashboard/analytics");
    return { success: true, reportId };
  } catch (err) {
    await Report.findByIdAndUpdate(reportId, {
      status: "FAILED",
      error: err instanceof Error ? err.message : "Processing failed",
    });
    return { error: err instanceof Error ? err.message : "Processing failed" };
  }
}

export async function deleteReport(reportId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  const report = await Report.findOne({
    _id: reportId,
    userId: session.user.id,
  });
  if (!report) return { error: "Report not found" };

  await OrderLine.deleteMany({ reportId: report._id });
  await Report.findByIdAndDelete(reportId);
  revalidatePath("/dashboard/reports");
  return { success: true };
}

export async function generateAiInsights(reportId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const cost = CREDIT_COSTS.AI_INSIGHTS;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || user.credits < cost) {
    return { error: `Need ${cost} credits for AI insights.` };
  }

  const report = await Report.findOne({
    _id: reportId,
    userId: session.user.id,
    status: "COMPLETED",
  });
  if (!report?.summary) return { error: "Report not found" };

  const lineDocs = await OrderLine.find({ reportId: report._id }).limit(10000).lean();
  const { generateEnhancedInsights } = await import("@/lib/openai-insights");

  const lines = lineDocs.map((l) => ({
    orderId: l.orderId,
    sku: l.sku,
    productName: l.productName,
    quantity: l.quantity,
    saleAmount: l.saleAmount,
    shipping: l.shipping,
    commission: l.commission,
    returnAmount: l.returnAmount,
    rtoAmount: l.rtoAmount,
    gst: l.gst,
    netProfit: l.netProfit,
    isReturn: l.isReturn,
    isRto: l.isRto,
    orderDate: l.orderDate,
  }));

  const insights = await generateEnhancedInsights(
    lines,
    report.summary as ReportSummary,
    report.marketplace ?? "MEESHO"
  );

  await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -cost } });
  await CreditTransaction.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    amount: -cost,
    type: "USAGE",
    description: `AI Insights: ${report.name}`,
    reportId: report._id,
  });
  await Report.findByIdAndUpdate(reportId, { insights, insightsAt: new Date() });

  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard/reports");
  return { success: true, insights };
}
