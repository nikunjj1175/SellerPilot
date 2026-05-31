import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Report, Payment } from "@/models";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("role suspended");
  if (!user || user.role !== "ADMIN" || user.suspended) {
    throw new Error("Admin access required");
  }

  return session;
}

export async function getAdminStats() {
  await connectDB();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [users, recentUsers, reports, payments, revenueAgg, reportStats] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Report.countDocuments(),
    Payment.countDocuments({ status: "PAID" }),
    Payment.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amountPaise" } } },
    ]),
    Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  return {
    users,
    recentUsers,
    reports,
    payments,
    revenuePaise: revenueAgg[0]?.total ?? 0,
    reportStats: Object.fromEntries(
      reportStats.map((r) => [String(r._id), r.count as number])
    ) as Record<string, number>,
  };
}
