import { connectDB } from "@/lib/mongodb";
import { User, Report } from "@/models";
import { UserSettings } from "@/models/UserSettings";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import type { ReportSummary } from "@/lib/meesho-parser";
import { formatINR } from "@/lib/utils";

const APP_URL = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export async function sendWeeklyDigests() {
  if (!isEmailConfigured()) return { sent: 0, reason: "Email not configured" };

  await connectDB();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const settingsList = await UserSettings.find({ weeklyDigestEnabled: true }).lean();
  let sent = 0;

  for (const settings of settingsList) {
    const user = await User.findById(settings.userId).select("name email");
    if (!user?.email) continue;

    const reports = await Report.find({
      userId: settings.userId,
      status: "COMPLETED",
      createdAt: { $gte: weekAgo },
    }).lean();

    if (reports.length === 0) continue;

    const summaries = reports
      .map((r) => r.summary as ReportSummary | undefined)
      .filter(Boolean) as ReportSummary[];

    const totalRevenue = summaries.reduce((s, x) => s + x.grossRevenue, 0);
    const totalProfit = summaries.reduce((s, x) => s + x.netProfit, 0);
    const avgReturn =
      summaries.reduce((s, x) => s + x.returnRate, 0) / summaries.length;

    const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="color:#7c3aed">Weekly SellerPilot Digest</h1>
  <p>Hi ${user.name ?? "Seller"},</p>
  <p>Your last 7 days: <strong>${reports.length}</strong> report(s) processed.</p>
  <ul>
    <li>Total revenue: ${formatINR(totalRevenue)}</li>
    <li>Total profit: ${formatINR(totalProfit)}</li>
    <li>Avg return rate: ${avgReturn.toFixed(1)}%</li>
  </ul>
  <a href="${APP_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Open Dashboard</a>
</body></html>`;

    try {
      await sendEmail({
        to: user.email,
        subject: `Weekly digest: ${reports.length} reports · ${formatINR(totalProfit)} profit`,
        html,
      });
      sent++;
    } catch (e) {
      console.error("Weekly digest failed", user.email, e);
    }
  }

  return { sent, checked: settingsList.length };
}
