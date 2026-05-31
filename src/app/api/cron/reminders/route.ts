import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, Report } from "@/models";
import { UserSettings } from "@/models/UserSettings";
import { sendEmail, buildReminderEmailHtml, isEmailConfigured } from "@/lib/email";

const APP_URL = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: true, reason: "Email not configured" });
  }

  await connectDB();

  const today = new Date();
  const dayOfMonth = today.getDate();

  const settingsList = await UserSettings.find({
    meeshoAutoReminder: true,
    emailReportsEnabled: true,
    reminderDayOfMonth: dayOfMonth,
  }).lean();

  let sent = 0;

  for (const settings of settingsList) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const recentReport = await Report.findOne({
      userId: settings.userId,
      createdAt: { $gte: monthStart },
    });

    if (recentReport) continue;

    const lastReminded = settings.lastReminderAt;
    if (lastReminded && lastReminded.getMonth() === today.getMonth()) continue;

    const user = await User.findById(settings.userId).select("name email");
    if (!user?.email) continue;

    try {
      await sendEmail({
        to: user.email,
        subject: "📊 Upload your Meesho monthly report — SellerPilot",
        html: buildReminderEmailHtml({
          userName: user.name ?? "Seller",
          marketplace: "Meesho",
          uploadUrl: `${APP_URL}/dashboard/reports`,
        }),
      });
      await UserSettings.updateOne(
        { _id: settings._id },
        { lastReminderAt: today }
      );
      sent++;
    } catch (e) {
      console.error("Reminder failed for", user.email, e);
    }
  }

  return NextResponse.json({ ok: true, sent, checked: settingsList.length });
}
