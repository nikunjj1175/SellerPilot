const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "SellerPilot <onboarding@resend.dev>";

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error("Email not configured. Add RESEND_API_KEY to .env");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email failed: ${err}`);
  }

  return res.json();
}

export function buildReportEmailHtml(params: {
  userName: string;
  reportName: string;
  marketplace: string;
  summary: {
    grossRevenue: number;
    netProfit: number;
    returnRate: number;
    rtoRate: number;
  };
  dashboardUrl: string;
}) {
  const { userName, reportName, marketplace, summary, dashboardUrl } = params;
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <h1 style="color:#7c3aed">SellerPilot Report</h1>
  <p>Hi ${userName},</p>
  <p>Your <strong>${marketplace}</strong> report <strong>${reportName}</strong> is ready.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee">Revenue</td><td style="padding:8px;border-bottom:1px solid #eee">₹${summary.grossRevenue.toLocaleString("en-IN")}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee">Net Profit</td><td style="padding:8px;border-bottom:1px solid #eee">₹${summary.netProfit.toLocaleString("en-IN")}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee">Return Rate</td><td style="padding:8px;border-bottom:1px solid #eee">${summary.returnRate.toFixed(1)}%</td></tr>
    <tr><td style="padding:8px">RTO Rate</td><td style="padding:8px">${summary.rtoRate.toFixed(1)}%</td></tr>
  </table>
  <a href="${dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">View Dashboard</a>
  <p style="margin-top:24px;font-size:12px;color:#71717a">SellerPilot — Meesho Seller Analytics</p>
</body>
</html>`;
}

export function buildReminderEmailHtml(params: {
  userName: string;
  marketplace: string;
  uploadUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="color:#7c3aed">Time to upload your ${params.marketplace} report</h1>
  <p>Hi ${params.userName},</p>
  <p>Your monthly settlement report is usually available now. Upload it to SellerPilot to track real profit & returns.</p>
  <ol>
    <li>Login to ${params.marketplace} seller panel</li>
    <li>Download settlement / payment CSV</li>
    <li>Upload on SellerPilot</li>
  </ol>
  <a href="${params.uploadUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Upload Report</a>
</body>
</html>`;
}
