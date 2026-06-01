"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { ProductSkuCost, Report } from "@/models";
import {
  getSkuCostRows,
  normalizeSkuSize,
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

  for (const row of rows) {
    const { sku, size } = normalizeSkuSize(row.sku, row.size);
    let packCost = Math.max(0, row.packCost ?? 0);
    const productCost = Math.max(0, row.productCost ?? 0);

    if (!opts?.applyPackToAll && opts?.fillMissingPack && packCost <= 0 && packDefault > 0) {
      packCost = packDefault;
    }

    await ProductSkuCost.findOneAndUpdate(
      { reportId: reportObjectId, sku, size },
      {
        $set: {
          userId: userObjectId,
          productName: row.productName?.trim() || sku,
          productCost,
          packCost,
        },
        $setOnInsert: { sku, size },
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
  const report = await assertReportOwner(session.user.id, reportId);
  await seedSkuCostsFromOrderLines(
    session.user.id,
    new mongoose.Types.ObjectId(reportId)
  );
  const { rows } = await getSkuCostRows(session.user.id, reportId, { pageSize: 50_000 });
  const safeName = report.name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return { csv: skuRowsToCsv(rows), fileName: `product-costs-${safeName}.csv` };
}

export async function importProductCostsCsv(reportId: string, csvText: string) {
  const rows = parseSkuCostCsv(csvText);
  if (!rows.length) {
    return { error: "No valid rows in CSV. Use columns: SKU, Size, Product Name, Product Cost, Packaging Cost." };
  }
  const res = await saveProductCosts(reportId, rows);
  if ("error" in res && res.error) return res;
  return { success: true, imported: rows.length };
}
