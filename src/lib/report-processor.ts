import { put } from "@vercel/blob";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { User, Report, OrderLine, CreditTransaction } from "@/models";
import { parseMarketplaceCsv } from "@/lib/marketplace-parser";
import { parseMeeshoFromFiles } from "@/lib/meesho-merge-parser";
import type { Marketplace } from "@/types/enums";
import type { ParsedOrderLine, ReportSummary } from "@/lib/meesho-parser";
import { notifyReportReady } from "@/lib/report-notify";

const BATCH_SIZE = 500;

export type MeeshoFilePayload = {
  ordersFileName?: string;
  gstSaleFileName?: string;
  gstReturnFileName?: string;
  ordersBuffer?: ArrayBuffer;
  gstSaleBuffer?: ArrayBuffer;
  gstReturnBuffer?: ArrayBuffer;
};

async function bufferToFile(buffer: ArrayBuffer, name: string): Promise<File> {
  return new File([buffer], name);
}

export async function processReportJob(payload: {
  reportId: string;
  userId: string;
  csvText: string;
  fileName: string;
  creditCost: number;
  marketplace?: Marketplace;
  storeBlob?: boolean;
  meeshoFiles?: MeeshoFilePayload;
}) {
  const {
    reportId,
    userId,
    csvText,
    fileName,
    creditCost,
    marketplace = "MEESHO",
    storeBlob,
    meeshoFiles,
  } = payload;

  await connectDB();
  const reportObjectId = new mongoose.Types.ObjectId(reportId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  try {
    let blobUrl: string | undefined;
    if (storeBlob && process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`reports/${userId}/${reportId}-${fileName}`, csvText, {
        access: "public",
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
    }

    let lines: ParsedOrderLine[];
    let summary: ReportSummary;

    if (
      marketplace === "MEESHO" &&
      meeshoFiles &&
      (meeshoFiles.ordersBuffer || meeshoFiles.gstSaleBuffer)
    ) {
      const result = await parseMeeshoFromFiles({
        orders: meeshoFiles.ordersBuffer
          ? await bufferToFile(meeshoFiles.ordersBuffer, meeshoFiles.ordersFileName ?? "orders.xlsx")
          : undefined,
        gstSale: meeshoFiles.gstSaleBuffer
          ? await bufferToFile(
              meeshoFiles.gstSaleBuffer,
              meeshoFiles.gstSaleFileName ?? "gst_sale.xlsx"
            )
          : undefined,
        gstReturn: meeshoFiles.gstReturnBuffer
          ? await bufferToFile(
              meeshoFiles.gstReturnBuffer,
              meeshoFiles.gstReturnFileName ?? "gst_return.xlsx"
            )
          : undefined,
      });
      lines = result.lines;
      summary = result.summary;
    } else {
      const parsed = parseMarketplaceCsv(marketplace, csvText);
      lines = parsed.lines;
      summary = parsed.summary;
    }

    if (lines.length === 0) {
      throw new Error("No rows found. Check Meesho export format.");
    }

    await User.findByIdAndUpdate(userObjectId, { $inc: { credits: -creditCost } });
    await CreditTransaction.create({
      userId: userObjectId,
      amount: -creditCost,
      type: "USAGE",
      description: "Report processing",
      reportId: reportObjectId,
    });
    await Report.findByIdAndUpdate(reportObjectId, {
      status: "COMPLETED",
      blobUrl,
      summary,
      fileName: meeshoFiles
        ? [meeshoFiles.ordersFileName, meeshoFiles.gstSaleFileName, meeshoFiles.gstReturnFileName]
            .filter(Boolean)
            .join(" + ")
        : fileName,
    });

    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      const batch = lines.slice(i, i + BATCH_SIZE).map((line) => ({
        reportId: reportObjectId,
        orderId: line.orderId,
        sku: line.sku,
        productName: line.productName,
        quantity: line.quantity,
        saleAmount: line.saleAmount,
        shipping: line.shipping,
        commission: line.commission,
        returnAmount: line.returnAmount,
        rtoAmount: line.rtoAmount,
        gst: line.gst,
        netProfit: line.netProfit,
        isReturn: line.isReturn,
        isRto: line.isRto,
        orderDate: line.orderDate,
        state: line.state,
        pincode: line.pincode,
      }));
      await OrderLine.insertMany(batch);
    }

    await notifyReportReady(userId, reportId);

    return { success: true, rowCount: lines.length };
  } catch (err) {
    await Report.findByIdAndUpdate(reportObjectId, {
      status: "FAILED",
      error: err instanceof Error ? err.message : "Processing failed",
    });
    throw err;
  }
}

export const LARGE_CSV_BYTES = 200 * 1024;
