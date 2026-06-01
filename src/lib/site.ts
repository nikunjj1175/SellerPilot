export const siteConfig = {
  name: "SellerPilot",
  tagline: "The Meesho P&L Companion",
  description:
    "Meesho seller analytics and profit & loss reports. Upload Orders and GST files, add SKU costs, and see real net profit, returns, RTO, and GST breakdown.",
  url: process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000",
  keywords: [
    "Meesho seller",
    "Meesho P&L",
    "Meesho profit calculator",
    "SKU profit",
    "Meesho GST report",
    "seller analytics India",
  ],
  locale: "en_IN",
} as const;
