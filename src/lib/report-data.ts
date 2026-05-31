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
}): ParsedOrderLine {
  return { ...l };
}

export type ReportDetailData = {
  id: string;
  name: string;
  marketplace: string;
  createdAt: string;
  summary: ReportSummary;
  ordersByState: StateOrderStats[];
  skuData: ReturnType<typeof aggregateBySku>;
  sampleOrders: ParsedOrderLine[];
  insights: AiInsightsResult | null;
  isDemo?: boolean;
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

  const lines = await OrderLine.find({ reportId: report._id }).limit(5000).lean();
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
    })
  );

  const summary = report.summary as ReportSummary;
  const ordersByState =
    summary.ordersByState?.length ? summary.ordersByState : aggregateByState(parsed);

  return {
    id: report._id.toString(),
    name: report.name,
    marketplace: report.marketplace ?? "MEESHO",
    createdAt: report.createdAt.toISOString(),
    summary,
    ordersByState,
    skuData: aggregateBySku(parsed),
    sampleOrders: parsed.slice(0, 50),
    insights: (report.insights as AiInsightsResult | null) ?? null,
  };
}

export async function getUserCompletedReports(userId: string) {
  await connectDB();
  return Report.find({ userId, status: "COMPLETED" })
    .sort({ createdAt: -1 })
    .select("name marketplace createdAt")
    .lean<Pick<IReport, "name" | "marketplace" | "createdAt" | "_id">[]>();
}

export async function getReportAnalytics(userId: string, reportId?: string) {
  await connectDB();
  const report = reportId
    ? await Report.findOne({ _id: reportId, userId, status: "COMPLETED" }).lean<IReport | null>()
    : await Report.findOne({ userId, status: "COMPLETED" })
        .sort({ createdAt: -1 })
        .lean<IReport | null>();

  if (!report?.summary) return null;

  const lines = await OrderLine.find({ reportId: report._id }).limit(5000).lean();
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
    })
  );

  return {
    report,
    summary: report.summary as ReportSummary,
    skuData: aggregateBySku(parsed),
    ordersByState:
      (report.summary as ReportSummary).ordersByState ?? aggregateByState(parsed),
  };
}
