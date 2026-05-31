export type UserRole = "USER" | "ADMIN" | "AGENCY";
export type OrgMemberRole = "OWNER" | "MEMBER";
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ReportType = "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
export type TransactionType = "PURCHASE" | "USAGE" | "REFUND" | "ADMIN_GRANT";
export type PaymentStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED";
export type Marketplace = "MEESHO" | "FLIPKART" | "AMAZON" | "SHOPSY";
export type UploadSource = "WEB" | "API" | "AGENCY";

export const MARKETPLACES: { id: Marketplace; label: string; description: string }[] = [
  { id: "MEESHO", label: "Meesho", description: "Settlement & order CSV from Meesho supplier panel" },
  { id: "FLIPKART", label: "Flipkart", description: "Seller Hub payment & order report" },
  { id: "AMAZON", label: "Amazon", description: "Amazon Seller Central transaction report" },
  { id: "SHOPSY", label: "Shopsy", description: "Uses Meesho-style CSV format" },
];
