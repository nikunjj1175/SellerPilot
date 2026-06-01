import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Report, type IReport } from "@/models/Report";
import { UserSettings } from "@/models/UserSettings";
import { sendEmail, buildReportEmailHtml, isEmailConfigured } from "@/lib/email";
import type { ReportSummary } from "@/lib/meesho-parser";

const APP_URL = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

/** Auto-send email when report completes (no extra credit if enabled in settings) */
export async function notifyReportReady(userId: string, reportId: string) {
  if (!isEmailConfigured()) return;

  await connectDB();
  const [user, report, settings] = await Promise.all([
    User.findById(userId).select("name email"),
    Report.findById(reportId).lean<IReport | null>(),
    UserSettings.findOne({ userId }),
  ]);

  if (!settings?.emailReportsEnabled || !user?.email || !report?.summary) return;

  const summary = report.summary as ReportSummary;
  try {
    await sendEmail({
      to: user.email,
      subject: `✅ Report ready: ${report.name}`,
      html: buildReportEmailHtml({
        userName: user.name ?? "Seller",
        reportName: report.name,
        marketplace: report.marketplace ?? "MEESHO",
        summary,
        dashboardUrl: `${APP_URL}/dashboard/reports/${reportId}`,
      }),
    });
  } catch (e) {
    console.error("Auto email failed:", e);
  }
}
