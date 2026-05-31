import { connectDB } from "@/lib/mongodb";
import { Report, OrderLine } from "@/models";
import type { IReport } from "@/models/Report";
import {
  aggregateBySku,
  aggregateByState,
  type ParsedOrderLine,
  type ReportSummary,
  type StateOrderStats,
} from "@/lib/meesho-parser";
import { buildMeeshoAnalytics, type MeeshoReportAnalytics } from "@/lib/meesho-analytics";
import type { AiInsightsResult } from "@/lib/ai-insights";

function toParsedLine(l: {
  orderId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  saleAmount: number;
  shipping: number;
  commission: number;
  returnAmount: number;
  rtoAmount: number;
  gst: number;
  netProfit: number;
  isReturn: boolean;
  isRto: boolean;
  orderDate?: Date;
  state?: string;
  pincode?: string;
  orderStatus?: string;
  supplierPrice?: number;
  size?: string;
  productCost?: number;
  packCost?: number;
}): ParsedOrderLine {
  return { ...l };
}

export type ReportDetailData = {
  id: string;
  name: string;
  createdAt: string;
  summary: ReportSummary;
  ordersByState: StateOrderStats[];
  skuData: ReturnType<typeof aggregateBySku>;
  orders: ParsedOrderLine[];
  analytics: MeeshoReportAnalytics;
  insights: AiInsightsResult | null;
  isDemo?: boolean;
  orderRowCount?: number;
};

export async function getReportDetail(
  userId: string,
  reportId: string
): Promise<ReportDetailData | null> {
  await connectDB();
  const report = await Report.findOne({
    _id: reportId,
    userId,
    status: "COMPLETED",
  }).lean<IReport | null>();

  if (!report?.summary) return null;

  const lines = await OrderLine.find({ reportId: report._id }).limit(10000).lean();
  const parsed = lines.map((l) =>
    toParsedLine({
      orderId: l.orderId,
      sku: l.sku,
      productName: l.productName,
      quantity: l.quantity,
      saleAmount: l.saleAmount,
      shipping: l.shipping,
      commission: l.commission,
      returnAmount: l.returnAmount,
      rtoAmount: l.rtoAmount,
      gst: l.gst,
      netProfit: l.netProfit,
      isReturn: l.isReturn,
      isRto: l.isRto,
      orderDate: l.orderDate,
      state: l.state,
      pincode: l.pincode,
      orderStatus: l.orderStatus,
      supplierPrice: l.supplierPrice,
      size: l.size,
      productCost: l.productCost,
      packCost: l.packCost,
    })
  );

  const summary = report.summary as ReportSummary;
  const ordersByState =
    summary.ordersByState?.length ? summary.ordersByState : aggregateByState(parsed);

  const orderRowCount = summary.totalOrders || parsed.length;

  return {
    id: report._id.toString(),
    name: report.name,
    createdAt: report.createdAt.toISOString(),
    summary,
    ordersByState,
    skuData: aggregateBySku(parsed),
    orders: parsed,
    analytics: buildMeeshoAnalytics(parsed, summary, orderRowCount),
    insights: (report.insights as AiInsightsResult | null) ?? null,
    orderRowCount,
  };
}

export async function getUserCompletedReports(userId: string) {
  await connectDB();
  return Report.find({ userId, status: "COMPLETED" })
    .sort({ createdAt: -1 })
    .select("name createdAt")
    .lean<Pick<IReport, "name" | "createdAt" | "_id">[]>();
}

/** @deprecated Old analytics routes redirect to tabbed report hub */
export async function getReportAnalytics(userId: string, reportId?: string) {
  if (!reportId) return null;
  return getReportDetail(userId, reportId);
}
