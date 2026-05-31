import { connectDB } from "@/lib/mongodb";
import { Report, OrderLine } from "@/models";
import { aggregateBySku, type ReportSummary } from "@/lib/meesho-parser";

export async function getDashboardStats(userId: string) {
  await connectDB();

  const reports = await Report.find({ userId, status: "COMPLETED" })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const latest = reports[0];
  const summary = (latest?.summary as ReportSummary | undefined) ?? null;

  const allSummaries = reports
    .map((r) => r.summary as ReportSummary | undefined)
    .filter(Boolean) as ReportSummary[];

  const totals = allSummaries.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.grossRevenue,
      profit: acc.profit + s.netProfit,
      orders: acc.orders + s.totalOrders,
      returns: acc.returns + s.returnCount,
      rto: acc.rto + s.rtoCount,
    }),
    { revenue: 0, profit: 0, orders: 0, returns: 0, rto: 0 }
  );

  const trend = [...reports].reverse().map((r) => {
    const s = r.summary as ReportSummary | undefined;
    return {
      name: new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      revenue: s?.grossRevenue ?? 0,
      profit: s?.netProfit ?? 0,
      returns: s?.returnCount ?? 0,
      rto: s?.rtoCount ?? 0,
    };
  });

  let skuData: ReturnType<typeof aggregateBySku> = [];
  if (latest) {
    const lines = await OrderLine.find({ reportId: latest._id }).limit(5000).lean();
    skuData = aggregateBySku(
      lines.map((l) => ({
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
      }))
    );
  }

  return { summary, totals, trend, skuData, reportCount: reports.length };
}
