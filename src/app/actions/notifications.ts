"use server";

import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Report, CreditTransaction } from "@/models";
import type { IReport } from "@/models/Report";
import { UserSettings } from "@/models/UserSettings";
import { CREDIT_COSTS } from "@/lib/credits";
import { sendEmail, buildReportEmailHtml, isEmailConfigured } from "@/lib/email";
import {
  buildWhatsAppReportMessage,
  getWhatsAppShareUrl,
  isWhatsAppApiConfigured,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";
import type { ReportSummary } from "@/lib/meesho-parser";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export async function sendReportByEmail(reportId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Unauthorized" };

  if (!isEmailConfigured()) {
    return { error: "Email not configured. Add RESEND_API_KEY in .env" };
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  const report = await Report.findOne({
    _id: reportId,
    userId: session.user.id,
    status: "COMPLETED",
  }).lean<IReport | null>();

  if (!report?.summary) return { error: "Report not found" };

  const cost = CREDIT_COSTS.EMAIL_REPORT;
  if (!user || user.credits < cost) return { error: `Need ${cost} credit` };

  const summary = report.summary as ReportSummary;
  await sendEmail({
    to: session.user.email,
    subject: `SellerPilot: ${report.name} — Profit ${summary.netProfit >= 0 ? "✓" : "⚠"}`,
    html: buildReportEmailHtml({
      userName: user.name ?? "Seller",
      reportName: report.name,
      marketplace: report.marketplace ?? "MEESHO",
      summary,
      dashboardUrl: `${APP_URL}/dashboard/analytics?report=${reportId}`,
    }),
  });

  await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -cost } });
  await CreditTransaction.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    amount: -cost,
    type: "USAGE",
    description: `Email report: ${report.name}`,
    reportId: report._id,
  });

  revalidatePath("/dashboard/reports");
  return { success: true };
}

export async function sendReportByWhatsApp(reportId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  const settings = await UserSettings.findOne({ userId: session.user.id });
  const phone = settings?.whatsappPhone;
  if (!phone) return { error: "Add WhatsApp number in Settings first" };

  const user = await User.findById(session.user.id);
  const report = await Report.findOne({
    _id: reportId,
    userId: session.user.id,
    status: "COMPLETED",
  }).lean<IReport | null>();

  if (!report?.summary) return { error: "Report not found" };

  const cost = CREDIT_COSTS.WHATSAPP_REPORT;
  if (!user || user.credits < cost) return { error: `Need ${cost} credit` };

  const summary = report.summary as ReportSummary;
  const message = buildWhatsAppReportMessage({
    reportName: report.name,
    marketplace: report.marketplace ?? "MEESHO",
    summary,
    dashboardUrl: `${APP_URL}/dashboard`,
  });

  if (isWhatsAppApiConfigured()) {
    await sendWhatsAppMessage(phone, message);
  } else {
    const shareUrl = getWhatsAppShareUrl(phone, message);
    await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -cost } });
    await CreditTransaction.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      amount: -cost,
      type: "USAGE",
      description: `WhatsApp share: ${report.name}`,
      reportId: report._id,
    });
    return { success: true, shareUrl };
  }

  await User.findByIdAndUpdate(session.user.id, { $inc: { credits: -cost } });
  await CreditTransaction.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    amount: -cost,
    type: "USAGE",
    description: `WhatsApp report: ${report.name}`,
    reportId: report._id,
  });

  revalidatePath("/dashboard/reports");
  return { success: true };
}
