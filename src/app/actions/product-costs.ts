"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { ProductSkuCost, Report } from "@/models";
import {
  getSkuCostRows,
  parseSkuCostCsv,
  recalculateReportWithProductCosts,
  seedSkuCostsFromOrderLines,
  skuRowsToCsv,
  type SkuCostRow,
} from "@/lib/product-costs";

async function assertReportOwner(userId: string, reportId: string) {
  await connectDB();
  const report = await Report.findOne({
    _id: reportId,
    userId,
    status: "COMPLETED",
  });
  if (!report) throw new Error("Report not found");
  return report;
}

export async function saveProductCosts(
  reportId: string,
  rows: SkuCostRow[],
  opts?: { commonPackCost?: number; fillMissingPack?: boolean; applyPackToAll?: boolean }
) {
  const session = await requireSession();
  await assertReportOwner(session.user.id, reportId);

  const reportObjectId = new mongoose.Types.ObjectId(reportId);
  const userObjectId = new mongoose.Types.ObjectId(session.user.id);

  if (opts?.applyPackToAll && opts.commonPackCost != null) {
    await ProductSkuCost.updateMany(
      { reportId: reportObjectId, userId: userObjectId },
      { $set: { packCost: opts.commonPackCost } }
    );
  }

  for (const row of rows) {
    const packCost =
      row.packCost > 0
        ? row.packCost
        : opts?.fillMissingPack && opts.commonPackCost != null
          ? opts.commonPackCost
          : row.packCost;

    await ProductSkuCost.findOneAndUpdate(
      { reportId: reportObjectId, sku: row.sku, size: row.size ?? "" },
      {
        $set: {
          userId: userObjectId,
          productName: row.productName,
          productCost: Math.max(0, row.productCost),
          packCost: Math.max(0, packCost),
        },
        $setOnInsert: { sku: row.sku, size: row.size ?? "" },
      },
      { upsert: true }
    );
  }

  await recalculateReportWithProductCosts(session.user.id, reportId);

  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/product-costs");

  return { success: true };
}

export async function loadProductCostPage(
  reportId: string,
  search?: string,
  page?: number
) {
  const session = await requireSession();
  await assertReportOwner(session.user.id, reportId);

  await seedSkuCostsFromOrderLines(
    session.user.id,
    new mongoose.Types.ObjectId(reportId)
  );

  const report = await Report.findById(reportId)
    .select("name createdAt")
    .lean<{ name: string; createdAt: Date } | null>();
  const data = await getSkuCostRows(session.user.id, reportId, {
    search,
    page,
    pageSize: 100,
  });

  return {
    report: report
      ? { id: reportId, name: report.name, createdAt: report.createdAt.toISOString() }
      : null,
    ...data,
  };
}

export async function exportProductCostsCsv(reportId: string) {
  const session = await requireSession();
  await assertReportOwner(session.user.id, reportId);
  const { rows } = await getSkuCostRows(session.user.id, reportId, { pageSize: 10000 });
  return skuRowsToCsv(rows);
}

export async function importProductCostsCsv(reportId: string, csvText: string) {
  const rows = parseSkuCostCsv(csvText);
  if (!rows.length) return { error: "No rows found in CSV" };
  return saveProductCosts(reportId, rows);
}
