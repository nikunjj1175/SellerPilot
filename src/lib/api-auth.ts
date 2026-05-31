import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { ApiKey, User } from "@/models";

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKeyValue() {
  const raw = crypto.randomBytes(24).toString("base64url");
  return `sp_live_${raw}`;
}

export async function authenticateApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing Authorization: Bearer <api_key>" as const };
  }

  const key = authHeader.slice(7).trim();
  if (!key.startsWith("sp_live_")) {
    return { error: "Invalid API key format" as const };
  }

  await connectDB();
  const keyHash = hashApiKey(key);
  const apiKey = await ApiKey.findOne({ keyHash, active: true });
  if (!apiKey) {
    return { error: "Invalid or revoked API key" as const };
  }

  const user = await User.findById(apiKey.userId);
  if (!user || user.suspended) {
    return { error: "Account suspended" as const };
  }

  await ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() });

  return { user, apiKey };
}
