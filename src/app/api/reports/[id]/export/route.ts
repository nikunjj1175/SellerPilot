import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthUserFromRequest, unauthorizedJson } from "@/lib/auth-jwt";
import { connectDB } from "@/lib/mongodb";
import { User, Report, OrderLine, CreditTransaction } from "@/models";
import type { IReport } from "@/models/Report";
import { CREDIT_COSTS } from "@/lib/credits";
import { buildCsvExport, buildPdfHtml } from "@/lib/export";
import type { ReportSummary } from "@/lib/meesho-parser";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser) return unauthorizedJson();

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "excel";
  const skipCharge = searchParams.get("preview") === "1";

  await connectDB();
  const report = await Report.findOne({
    _id: id,
    userId: authUser.id,
    status: "COMPLETED",
  }).lean<IReport | null>();

  if (!report?.summary) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const creditCost =
    format === "pdf" ? CREDIT_COSTS.PDF_EXPORT : CREDIT_COSTS.EXCEL_EXPORT;

  if (!skipCharge) {
    const dbUser = await User.findById(authUser.id);
    if (!dbUser || dbUser.credits < creditCost) {
      return NextResponse.json({ error: `Need ${creditCost} credits` }, { status: 402 });
    }

    await User.findByIdAndUpdate(authUser.id, { $inc: { credits: -creditCost } });
    await CreditTransaction.create({
      userId: new mongoose.Types.ObjectId(authUser.id),
      amount: -creditCost,
      type: "USAGE",
      description: `${format.toUpperCase()} export: ${report.name}`,
      reportId: report._id,
    });
  }

  const lineItems = await OrderLine.find({ reportId: report._id }).lean();
  const summary = report.summary as ReportSummary;
  const rows = lineItems.map((l) => ({
    orderId: l.orderId ?? "",
    sku: l.sku ?? "",
    productName: l.productName ?? "",
    quantity: l.quantity,
    saleAmount: l.saleAmount,
    commission: l.commission,
    shipping: l.shipping,
    returnAmount: l.returnAmount,
    rtoAmount: l.rtoAmount,
    gst: l.gst,
    netProfit: l.netProfit,
    isReturn: l.isReturn,
    isRto: l.isRto,
    state: l.state,
  }));

  if (format === "pdf") {
    const html = buildPdfHtml(report.name, summary, rows);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${report.name}.html"`,
      },
    });
  }

  const csv = buildCsvExport(report.name, summary, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.name}.csv"`,
    },
  });
}
