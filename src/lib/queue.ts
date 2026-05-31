const QSTASH_URL = "https://qstash.upstash.io/v2/publish";

export function isQueueConfigured() {
  return Boolean(process.env.QSTASH_TOKEN && process.env.APP_URL);
}

export async function enqueueReportProcessing(payload: {
  reportId: string;
  userId: string;
  creditCost: number;
  reportName: string;
  blobUrl: string;
  fileName: string;
}) {
  const token = process.env.QSTASH_TOKEN;
  const appUrl = process.env.APP_URL ?? process.env.AUTH_URL;

  if (!token || !appUrl) {
    return { queued: false as const };
  }

  const destination = `${appUrl.replace(/\/$/, "")}/api/jobs/process-report`;

  const res = await fetch(`${QSTASH_URL}/${destination}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Queue publish failed: ${text}`);
  }

  return { queued: true as const };
}
