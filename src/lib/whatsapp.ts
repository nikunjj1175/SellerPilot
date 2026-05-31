import type { ReportSummary } from "@/lib/meesho-parser";
import { formatINR } from "@/lib/utils";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

export function isWhatsAppApiConfigured() {
  return Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_WHATSAPP_FROM);
}

export function buildWhatsAppReportMessage(params: {
  reportName: string;
  marketplace: string;
  summary: ReportSummary;
  dashboardUrl: string;
}) {
  const { reportName, marketplace, summary, dashboardUrl } = params;
  return (
    `📊 *SellerPilot Report*\n` +
    `${marketplace}: ${reportName}\n\n` +
    `💰 Revenue: ${formatINR(summary.grossRevenue)}\n` +
    `✅ Net Profit: ${formatINR(summary.netProfit)}\n` +
    `↩️ Returns: ${summary.returnRate.toFixed(1)}%\n` +
    `🚚 RTO: ${summary.rtoRate.toFixed(1)}%\n\n` +
    `View: ${dashboardUrl}`
  );
}

export function getWhatsAppShareUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("91") ? digits : `91${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppMessage(toPhone: string, body: string) {
  if (!isWhatsAppApiConfigured()) {
    throw new Error("WhatsApp API not configured. Add Twilio env vars or use Share link.");
  }

  const to = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:+${toPhone.replace(/\D/g, "")}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM!,
      To: to,
      Body: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }

  return res.json();
}
