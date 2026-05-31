"use server";

import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { UserSettings } from "@/models/UserSettings";
import type { Marketplace } from "@/types/enums";
import { revalidatePath } from "next/cache";

export async function getOrCreateSettings(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);
  let settings = await UserSettings.findOne({ userId: oid });
  if (!settings) {
    settings = await UserSettings.create({ userId: oid });
  }
  return settings;
}

export async function updateUserSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();

  const meeshoSellerId = (formData.get("meeshoSellerId") as string) || undefined;
  const meeshoAutoReminder = formData.get("meeshoAutoReminder") === "on";
  const reminderDayOfMonth = Math.min(
    28,
    Math.max(1, parseInt(formData.get("reminderDayOfMonth") as string, 10) || 5)
  );
  const emailReportsEnabled = formData.get("emailReportsEnabled") === "on";
  const whatsappReportsEnabled = formData.get("whatsappReportsEnabled") === "on";
  const whatsappPhone = (formData.get("whatsappPhone") as string) || undefined;
  const weeklyDigestEnabled = formData.get("weeklyDigestEnabled") === "on";

  const marketplaces = formData.getAll("marketplaces") as Marketplace[];
  const connectedMarketplaces =
    marketplaces.length > 0 ? marketplaces : (["MEESHO"] as Marketplace[]);

  await UserSettings.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(session.user.id) },
    {
      meeshoSellerId,
      meeshoAutoReminder,
      reminderDayOfMonth,
      emailReportsEnabled,
      whatsappReportsEnabled,
      whatsappPhone,
      weeklyDigestEnabled,
      connectedMarketplaces,
    },
    { upsert: true, new: true }
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/integrations");
  return { success: true };
}
