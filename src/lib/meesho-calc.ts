/**
 * Meesho P&L economics (ex-GST).
 * tcs_sales "total_taxable_sale_value" = product taxable + taxable_shipping (per Meesho GST export).
 */

export function splitTaxableAndShipping(totalTaxable: number, taxableShipping: number) {
  const ship = Math.max(0, taxableShipping);
  if (totalTaxable <= 0) return { productTaxable: 0, shipping: ship };
  if (ship > totalTaxable) {
    return { productTaxable: totalTaxable, shipping: ship };
  }
  return { productTaxable: totalTaxable - ship, shipping: ship };
}

/** Per-order profit ex-GST (GST is pass-through, not deducted). */
export function orderNetProfitExGst(line: {
  saleAmount: number;
  returnAmount: number;
  shipping: number;
  commission: number;
  rtoAmount: number;
}) {
  return (
    line.saleAmount - line.returnAmount - line.shipping - line.commission - line.rtoAmount
  );
}

export function sumLineEconomics(
  lines: {
    saleAmount: number;
    returnAmount: number;
    shipping: number;
    commission: number;
    rtoAmount: number;
    gst: number;
    netProfit: number;
    isReturn: boolean;
    isRto: boolean;
  }[]
) {
  return {
    grossProductSales: lines.reduce((s, l) => s + l.saleAmount, 0),
    returnCharges: lines.reduce((s, l) => s + l.returnAmount, 0),
    shippingCharges: lines.reduce((s, l) => s + l.shipping, 0),
    marketplaceCharges: lines.reduce((s, l) => s + l.commission, 0),
    rtoLoss: lines.reduce((s, l) => s + l.rtoAmount, 0),
    gstCollected: lines.reduce((s, l) => s + l.gst, 0),
    netProfit: lines.reduce((s, l) => s + l.netProfit, 0),
    returnCount: lines.filter((l) => l.isReturn).length,
    rtoCount: lines.filter((l) => l.isRto).length,
  };
}
