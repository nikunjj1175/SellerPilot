import { parseMeeshoMergedReports } from "../src/lib/meesho-merge-parser.ts";
import { fileToRows } from "../src/lib/spreadsheet.ts";
import fs from "fs";

const ordersPath =
  "c:/Users/WIN 11X1/Downloads/Orders_2026-04-01_2026-04-30_2026-05-23_13_24-13_29_4118160 (1).csv";
const gstSalePath = "c:/Users/WIN 11X1/Downloads/tcs_sales.xlsx";
const gstReturnPath = "c:/Users/WIN 11X1/Downloads/tcs_sales_return.xlsx";

async function main() {
  const ordersFile = new File([fs.readFileSync(ordersPath)], "orders.csv", { type: "text/csv" });
  const gstSaleFile = new File([fs.readFileSync(gstSalePath)], "tcs_sales.xlsx");
  const gstReturnFile = new File([fs.readFileSync(gstReturnPath)], "tcs_sales_return.xlsx");

  const [ordersRows, gstSaleRows, gstReturnRows] = await Promise.all([
    fileToRows(ordersFile),
    fileToRows(gstSaleFile),
    fileToRows(gstReturnFile),
  ]);

  const { lines, summary } = parseMeeshoMergedReports({ ordersRows, gstSaleRows, gstReturnRows });

  console.log("=== APRIL MEESHO P&L (ex-GST) ===");
  console.log("Total order lines:", lines.length);
  console.log("Gross taxable (ex-GST):", summary.grossRevenueExGst?.toFixed(2));
  console.log("Returns (ex-GST):", summary.gstReturnTotal?.toFixed(2));
  console.log("Net taxable sales:", summary.netTaxableSales?.toFixed(2));
  console.log("Shipping (ex-GST):", summary.shippingExGst?.toFixed(2));
  console.log("GST collected (info):", summary.gstCollected?.toFixed(2));
  console.log("RTO loss:", summary.rtoLoss.toFixed(2));
  console.log("Net profit (ex-GST):", summary.netProfit.toFixed(2));
  console.log("Return rate:", summary.returnRate.toFixed(1) + "%");
  console.log("RTO rate:", summary.rtoRate.toFixed(1) + "%");
  console.log("States:", summary.ordersByState?.length);
  console.log("\nTop 5 states:");
  summary.ordersByState?.slice(0, 5).forEach((s) => {
    console.log(`  ${s.state}: ${s.orderCount} orders, ₹${s.revenue.toFixed(0)} taxable`);
  });
}

main().catch(console.error);
