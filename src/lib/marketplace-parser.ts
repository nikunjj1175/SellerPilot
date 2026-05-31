import { parseMeeshoCsv } from "@/lib/meesho-parser";
import { parseFlipkartCsv } from "@/lib/flipkart-parser";
import { parseAmazonCsv } from "@/lib/amazon-parser";
import type { Marketplace } from "@/types/enums";

export function parseMarketplaceCsv(marketplace: Marketplace, csvText: string) {
  switch (marketplace) {
    case "FLIPKART":
      return parseFlipkartCsv(csvText);
    case "AMAZON":
      return parseAmazonCsv(csvText);
    case "SHOPSY":
    case "MEESHO":
    default:
      return parseMeeshoCsv(csvText);
  }
}
