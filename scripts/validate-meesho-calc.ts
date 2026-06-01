/**
 * Run: npx tsx scripts/validate-meesho-calc.ts
 * Validates Meesho merge math (no sample files required).
 */
import assert from "node:assert/strict";
import { splitTaxableAndShipping, orderNetProfitExGst } from "../src/lib/meesho-calc";
import { parseMeeshoMergedReports } from "../src/lib/meesho-merge-parser";

assert.deepEqual(splitTaxableAndShipping(118, 18), {
  productTaxable: 100,
  shipping: 18,
});

const deliveredProfit = orderNetProfitExGst({
  saleAmount: 100,
  returnAmount: 0,
  shipping: 18,
  commission: 12,
  rtoAmount: 0,
});
assert.equal(deliveredProfit, 70);

const { lines, summary } = parseMeeshoMergedReports({
  ordersRows: [
    {
      "Sub Order No": "SO1",
      "Reason for Credit Entry": "DELIVERED",
      "Supplier Listed Price (incl. GST + Commission)": "112",
      "Supplier Discounted Price (Incl GST and Commision)": "100",
      "Product Name": "Test Kurti",
      SKU: "K1",
      Quantity: "1",
    },
  ],
  gstSaleRows: [
    {
      sub_order_num: "SO1",
      total_taxable_sale_value: "118",
      taxable_shipping: "18",
      tax_amount: "21.24",
    },
  ],
  gstReturnRows: [],
});

assert.equal(lines.length, 1);
assert.equal(lines[0].saleAmount, 100);
assert.equal(lines[0].shipping, 18);
assert.equal(lines[0].commission, 12);
assert.equal(lines[0].netProfit, 70);
assert.equal(summary.netProfit, 70);
assert.equal(summary.netTaxableSales, 118);

const rto = parseMeeshoMergedReports({
  ordersRows: [
    {
      "Sub Order No": "SO2",
      "Reason for Credit Entry": "RTO",
      "Supplier Discounted Price (Incl GST and Commision)": "200",
    },
  ],
  gstSaleRows: [
    {
      sub_order_num: "SO2",
      total_taxable_sale_value: "50",
      taxable_shipping: "30",
      tax_amount: "9",
    },
  ],
  gstReturnRows: [],
});

assert.ok(rto.lines[0].isRto);
assert.equal(rto.lines[0].saleAmount, 0);
assert.ok(rto.lines[0].rtoAmount >= 30);

const cancelledMix = parseMeeshoMergedReports({
  ordersRows: [
    { "Sub Order No": "SO3", "Reason for Credit Entry": "CANCELLED", SKU: "X1", "Product Name": "Cancelled top" },
    { "Sub Order No": "SO4", "Reason for Credit Entry": "DELIVERED", SKU: "X2", "Product Name": "Delivered top" },
  ],
  gstSaleRows: [
    { sub_order_num: "SO4", total_taxable_sale_value: "100", taxable_shipping: "0", tax_amount: "18" },
  ],
  gstReturnRows: [],
});

assert.equal(cancelledMix.summary.grossOrderCount, 2);
assert.equal(cancelledMix.summary.cancelledCount, 1);
assert.equal(cancelledMix.summary.netOrders, 1);
assert.equal(cancelledMix.lines.length, 2);
assert.ok(cancelledMix.lines.some((l) => l.isCancelled));

console.log("✓ Meesho calculation tests passed");
console.log("  Delivered sample net profit:", summary.netProfit);
console.log("  RTO sample rto loss:", rto.summary.rtoLoss);
console.log("  Gross/net orders:", cancelledMix.summary.grossOrderCount, "→", cancelledMix.summary.netOrders);
