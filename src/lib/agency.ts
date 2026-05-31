import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Organization, OrganizationMember, SellerStore, Report } from "@/models";
import type { IOrganization } from "@/models/Organization";
import type { IOrganizationMember } from "@/models/OrganizationMember";
import type { ISellerStore } from "@/models/SellerStore";
import type { IReport } from "@/models/Report";
import type { ReportSummary } from "@/lib/meesho-parser";

export async function getUserOrganization(userId: string) {
  await connectDB();
  const membership = await OrganizationMember.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).lean<IOrganizationMember>();

  if (!membership) return null;

  const org = await Organization.findById(membership.organizationId).lean<IOrganization>();
  if (!org) return null;

  return { org, membership };
}

export async function getAgencyDashboardData(userId: string) {
  const ctx = await getUserOrganization(userId);
  if (!ctx) return null;

  const stores = await SellerStore.find({
    organizationId: ctx.org._id,
    active: true,
  })
    .sort({ name: 1 })
    .lean<ISellerStore[]>();

  const storeStats = await Promise.all(
    stores.map(async (store) => {
      const latest = await Report.findOne({
        storeId: store._id,
        status: "COMPLETED",
      })
        .sort({ createdAt: -1 })
        .lean<IReport>();

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthReports = await Report.countDocuments({
        storeId: store._id,
        status: "COMPLETED",
        createdAt: { $gte: monthStart },
      });

      const summary = latest?.summary as ReportSummary | undefined;

      return {
        store,
        latestReport: latest,
        monthReports,
        revenue: summary?.grossRevenue ?? 0,
        profit: summary?.netProfit ?? 0,
        returnRate: summary?.returnRate ?? 0,
      };
    })
  );

  const totals = storeStats.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      profit: acc.profit + s.profit,
      stores: acc.stores + 1,
      reports: acc.reports + s.monthReports,
    }),
    { revenue: 0, profit: 0, stores: 0, reports: 0 }
  );

  return {
    organization: ctx.org,
    membership: ctx.membership,
    storeStats,
    totals,
  };
}

export async function getAgencyStoresForUser(userId: string) {
  const ctx = await getUserOrganization(userId);
  if (!ctx) return [];

  const stores = await SellerStore.find({
    organizationId: ctx.org._id,
    active: true,
  })
    .sort({ name: 1 })
    .lean<ISellerStore[]>();

  return stores.map((s) => ({
    id: s._id.toString(),
    name: s.name,
    marketplace: s.marketplace,
  }));
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
