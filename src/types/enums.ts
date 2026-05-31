export type UserRole = "USER" | "ADMIN" | "AGENCY";
export type OrgMemberRole = "OWNER" | "MEMBER";
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ReportType = "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
export type TransactionType = "PURCHASE" | "USAGE" | "REFUND" | "ADMIN_GRANT";
export type PaymentStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED";
export type Marketplace = "MEESHO";
export type UploadSource = "WEB" | "API" | "AGENCY";

export const MEESHO_LABEL = "Meesho";
