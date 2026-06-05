import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Report, Payment } from "@/models";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).select("role suspended");
  if (!user || user.role !== "ADMIN" || user.suspended) {
    redirect("/login?error=AdminRequired");
  }

  return session;
}

export type AdminRevenuePoint = { date: string; label: string; revenue: number; orders: number };
export type AdminSignupPoint = { date: string; label: string; signups: number };

function fillRevenueSeries(rows: Map<string, { revenue: number; orders: number }>): AdminRevenuePoint[] {
  const out: AdminRevenuePoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const src = rows.get(key);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue: src?.revenue ?? 0,
      orders: src?.orders ?? 0,
    });
  }
  return out;
}

function fillSignupSeries(rows: Map<string, { signups: number }>): AdminSignupPoint[] {
  const out: AdminSignupPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const src = rows.get(key);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      signups: src?.signups ?? 0,
    });
  }
  return out;
}

export async function getAdminStats() {
  await connectDB();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    recentUsers,
    reports,
    payments,
    revenueAgg,
    reportStats,
    revenueDaily,
    signupsDaily,
    creditsSold,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: "ADMIN" } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, role: { $ne: "ADMIN" } }),
    Report.countDocuments(),
    Payment.countDocuments({ status: "PAID" }),
    Payment.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amountPaise" } } },
    ]),
    Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: "PAID", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amountPaise" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, role: { $ne: "ADMIN" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          signups: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, credits: { $sum: "$credits" } } },
    ]),
  ]);

  const reportStatsMap = Object.fromEntries(
    reportStats.map((r) => [String(r._id), r.count as number])
  ) as Record<string, number>;

  const revenueMap = new Map(
    revenueDaily.map((r) => [
      String(r._id),
      {
        revenue: Math.round((r.revenue as number) / 100),
        orders: r.orders as number,
      },
    ])
  );
  const signupMap = new Map(
    signupsDaily.map((r) => [String(r._id), { signups: r.signups as number }])
  );

  const revenueSeries = fillRevenueSeries(revenueMap);
  const signupSeries = fillSignupSeries(signupMap);

  const reportStatusChart = [
    { name: "Completed", value: reportStatsMap.COMPLETED ?? 0, fill: "#7c3aed" },
    { name: "Processing", value: reportStatsMap.PROCESSING ?? 0, fill: "#a78bfa" },
    { name: "Failed", value: reportStatsMap.FAILED ?? 0, fill: "#ef4444" },
    { name: "Pending", value: reportStatsMap.PENDING ?? 0, fill: "#c4b5fd" },
  ].filter((x) => x.value > 0);

  return {
    users,
    recentUsers,
    reports,
    payments,
    revenuePaise: revenueAgg[0]?.total ?? 0,
    creditsSold: creditsSold[0]?.credits ?? 0,
    reportStats: reportStatsMap,
    revenueSeries,
    signupSeries,
    reportStatusChart,
  };
}
