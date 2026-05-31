import { parseMeeshoCsv } from "@/lib/meesho-parser";

/** Amazon Seller Central transaction/settlement CSV */
export function parseAmazonCsv(csvText: string) {
  const normalized = csvText
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\bASIN\b/gi, "SKU")
        .replace(/\bProduct Sales\b/gi, "Sale Amount")
        .replace(/\bSelling Fees\b/gi, "Commission")
        .replace(/\bFBA fees\b/gi, "Shipping")
        .replace(/\bShipping credits\b/gi, "Shipping")
        .replace(/\bRefund\b/gi, "Return Amount")
        .replace(/\bOrder ID\b/gi, "Order ID")
        .replace(/\bDescription\b/gi, "Product Name")
        .replace(/\bShip State\b/gi, "State")
        .replace(/\bShip To State\b/gi, "State")
        .replace(/\bShipping State\b/gi, "State")
        .replace(/\bDelivery State\b/gi, "State")
        .replace(/\bBill State\b/gi, "State")
        .replace(/\bShip Postal Code\b/gi, "Pincode")
        .replace(/\bShip To Postal Code\b/gi, "Pincode")
        .replace(/\bPostal Code\b/gi, "Pincode")
        .replace(/\bPin Code\b/gi, "Pincode")
    )
    .join("\n");

  return parseMeeshoCsv(normalized);
}
