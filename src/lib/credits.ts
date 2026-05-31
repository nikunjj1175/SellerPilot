export const CREDIT_COSTS = {
  MONTHLY_REPORT: 2,
  QUARTERLY_REPORT: 5,
  YEARLY_REPORT: 10,
  AI_INSIGHTS: 5,
  PDF_EXPORT: 1,
  EXCEL_EXPORT: 1,
  EMAIL_REPORT: 1,
  WHATSAPP_REPORT: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}
