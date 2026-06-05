"use server";

import { after } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Report, OrderLine, CreditTransaction } from "@/models";
import { CREDIT_COSTS } from "@/lib/credits";
import { LARGE_CSV_BYTES, processReportJob } from "@/lib/report-processor";
import type { ReportType } from "@/types/enums";
import type { ReportSummary } from "@/lib/meesho-parser";
import { revalidatePath } from "next/cache";

function getCreditCost(reportType: ReportType) {
  switch (reportType) {
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
  if (!session?.user?.id) return { error: "Please sign in first." };

  const reportName = (formData.get("name") as string) || "";
  const reportType = ((formData.get("type") as string) || "MONTHLY") as ReportType;
  const reportMonth = (formData.get("reportMonth") as string) || "";
  const miscCosts = Math.max(0, parseFloat((formData.get("miscCosts") as string) || "0") || 0);
  const notes = ((formData.get("notes") as string) || "").trim();

  const ordersFile = formData.get("ordersFile") as File | null;
  const gstSaleFile = formData.get("gstSaleFile") as File | null;
  const gstReturnFile = formData.get("gstReturnFile") as File | null;

  if (!ordersFile?.size || !gstSaleFile?.size) {
    return { error: "Upload Meesho Orders CSV and tcs_sales.xlsx (GST Return optional)." };
  }

  const creditCost = getCreditCost(reportType);

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || user.credits < creditCost) {
    return { error: `Not enough credits. This report needs ${creditCost} credits.` };
  }

  const displayName =
    reportName.trim() || `Meesho P&L — ${ordersFile.name.replace(/\.[^.]+$/, "")}`;

  const report = await Report.create({
    userId: user._id,
    name: displayName,
    marketplace: "MEESHO",
    type: reportType,
    status: "PROCESSING",
    fileName: `${ordersFile.name} + ${gstSaleFile.name}`,
    creditsUsed: creditCost,
    uploadSource: "WEB",
    reportMonth: reportMonth || undefined,
    miscCosts,
    notes: notes || undefined,
  });

  const reportId = report._id.toString();

  const meeshoFiles = {
    ordersFileName: ordersFile.name,
    gstSaleFileName: gstSaleFile.name,
    gstReturnFileName: gstReturnFile?.size ? gstReturnFile.name : undefined,
    ordersBuffer: await ordersFile.arrayBuffer(),
    gstSaleBuffer: await gstSaleFile.arrayBuffer(),
    gstReturnBuffer: gstReturnFile?.size ? await gstReturnFile.arrayBuffer() : undefined,
  };

  const totalBytes = ordersFile.size + gstSaleFile.size + (gstReturnFile?.size ?? 0);
  const isLarge = totalBytes >= LARGE_CSV_BYTES;

  try {
    if (isLarge) {
      after(async () => {
        await processReportJob({
          reportId,
          userId: session.user.id,
          fileName: ordersFile.name,
          creditCost,
          meeshoFiles,
          reportMonth: reportMonth || undefined,
          miscCosts,
          storeBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        });
      });
      revalidatePath("/dashboard/reports");
      return {
        success: true,
        reportId,
        queued: true,
        message: "Processing in background. Refresh shortly.",
      };
    }

    await processReportJob({
      reportId,
      userId: session.user.id,
      fileName: ordersFile.name,
      creditCost,
      meeshoFiles,
      reportMonth: reportMonth || undefined,
      miscCosts,
      storeBlob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });

    revalidatePath("/dashboard/reports");
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
  const report = await Report.findOne({ _id: reportId, userId: session.user.id });
  if (!report) return { error: "Report not found" };

  const { ProductSkuCost } = await import("@/models");
  await OrderLine.deleteMany({ reportId: report._id });
  await ProductSkuCost.deleteMany({ reportId: report._id });
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
    orderStatus: l.orderStatus,
    state: l.state,
  }));

  const insights = await generateEnhancedInsights(
    lines,
    report.summary as ReportSummary,
    "MEESHO"
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

  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath("/dashboard/reports");
  return { success: true, insights };
}
