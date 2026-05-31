import { parseMeeshoCsv } from "@/lib/meesho-parser";

/** Flipkart Seller Hub reports — flexible column names */
export function parseFlipkartCsv(csvText: string) {
  const normalized = csvText
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\bFSN\b/gi, "SKU")
        .replace(/\bSeller SKU\b/gi, "SKU")
        .replace(/\bFinal Settlement Amount\b/gi, "Sale Amount")
        .replace(/\bMarketplace Fee\b/gi, "Commission")
        .replace(/\bShipping Fee\b/gi, "Shipping")
        .replace(/\bReturn Amount\b/gi, "Return Amount")
        .replace(/\bOrder Item ID\b/gi, "Order ID")
        .replace(/\bProduct Title\b/gi, "Product Name")
        .replace(/\bShip To State\b/gi, "State")
        .replace(/\bShipping State\b/gi, "State")
        .replace(/\bCustomer State\b/gi, "State")
        .replace(/\bDelivery State\b/gi, "State")
        .replace(/\bDestination State\b/gi, "State")
        .replace(/\bShip To Pincode\b/gi, "Pincode")
        .replace(/\bShipping Pincode\b/gi, "Pincode")
        .replace(/\bDelivery Pincode\b/gi, "Pincode")
        .replace(/\bPin Code\b/gi, "Pincode")
    )
    .join("\n");

  return parseMeeshoCsv(normalized);
}
