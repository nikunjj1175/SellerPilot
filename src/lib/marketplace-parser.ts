import { parseMeeshoCsv } from "@/lib/meesho-parser";

/** SellerPilot is Meesho-only — all CSV parsing uses Meesho format */
export function parseMarketplaceCsv(_marketplace: "MEESHO", csvText: string) {
  return parseMeeshoCsv(csvText);
}
