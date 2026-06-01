import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { processReportJob } from "@/lib/report-processor";

async function verifyQStash(req: Request, body: string) {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!current) return true;

  const receiver = new Receiver({
    currentSigningKey: current,
    nextSigningKey: next ?? current,
  });

  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;

  return receiver.verify({ signature, body });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (process.env.NODE_ENV === "production" && !signingKey) {
    return NextResponse.json({ error: "Webhook verification required" }, { status: 403 });
  }

  if (signingKey) {
    const ok = await verifyQStash(req, rawBody);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody) as {
    reportId: string;
    userId: string;
    creditCost: number;
    blobUrl: string;
    fileName: string;
  };

  const fileRes = await fetch(payload.blobUrl);
  if (!fileRes.ok) {
    return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: 404 });
  }
  const csvText = await fileRes.text();

  await processReportJob({
    reportId: payload.reportId,
    userId: payload.userId,
    csvText,
    fileName: payload.fileName,
    creditCost: payload.creditCost,
    storeBlob: false,
  });

  return NextResponse.json({ ok: true });
}
