"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { ProductSkuCost, Report } from "@/models";
import {
  bulkSaveSkuCosts,
  dedupeSkuCostRows,
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
  const packDefault = Math.max(0, opts?.commonPackCost ?? 0);

  if (opts?.applyPackToAll && packDefault > 0) {
    await ProductSkuCost.updateMany(
      { reportId: reportObjectId, userId: userObjectId },
      { $set: { packCost: packDefault } }
    );
  } else if (opts?.fillMissingPack && packDefault > 0) {
    await ProductSkuCost.updateMany(
      {
        reportId: reportObjectId,
        userId: userObjectId,
        packCost: { $lte: 0 },
      },
      { $set: { packCost: packDefault } }
    );
  }

  const { rows: uniqueRows } = dedupeSkuCostRows(rows);
  await bulkSaveSkuCosts(session.user.id, reportId, uniqueRows);

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
    pageSize: 50,
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
  const report = await assertReportOwner(session.user.id, reportId);
  await seedSkuCostsFromOrderLines(
    session.user.id,
    new mongoose.Types.ObjectId(reportId)
  );
  // Export must include ALL rows, regardless of UI pagination.
  const { rows } = await getSkuCostRows(session.user.id, reportId, {
    page: 1,
    pageSize: 100_000,
  });
  const safeName = report.name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return {
    csv: skuRowsToCsv(rows),
    fileName: `product-costs-${safeName}.csv`,
    rowCount: rows.length,
  };
}

export async function importProductCostsCsv(reportId: string, csvText: string) {
  const session = await requireSession();
  await assertReportOwner(session.user.id, reportId);

  const { rows: parsed, duplicateRows } = parseSkuCostCsv(csvText);
  if (!parsed.length) {
    return {
      error:
        "No valid rows in CSV. Keep header row with: Cost Row ID, SKU, Size, Product Cost, Packaging Cost.",
    };
  }

  const result = await bulkSaveSkuCosts(session.user.id, reportId, parsed);
  await recalculateReportWithProductCosts(session.user.id, reportId);

  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/product-costs");

  return {
    success: true,
    imported: result.saved,
    duplicateRowsMerged: duplicateRows,
    matchedById: result.matchedById,
    matchedBySku: result.matchedBySku,
    unmatched: result.unmatched,
  };
}
