import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(req: Request) {
  const authResult = await authenticateApiKey(req.headers.get("authorization"));
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  return NextResponse.json({
    id: authResult.user._id.toString(),
    email: authResult.user.email,
    name: authResult.user.name,
    credits: authResult.user.credits,
    role: authResult.user.role,
  });
}
