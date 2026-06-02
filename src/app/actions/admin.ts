"use server";

import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin";
import { connectDB } from "@/lib/mongodb";
import { User, CreditTransaction, Coupon, Report, OrderLine } from "@/models";
import type { UserRole } from "@/types/enums";
import { revalidatePath } from "next/cache";

export async function adminUpdateUserCredits(userId: string, amount: number, reason: string) {
  await requireAdmin();
  await connectDB();

  await User.findByIdAndUpdate(userId, { $inc: { credits: amount } });
  await CreditTransaction.create({
    userId: new mongoose.Types.ObjectId(userId),
    amount,
    type: amount > 0 ? "ADMIN_GRANT" : "USAGE",
    description: reason || "Admin adjustment",
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminToggleSuspend(userId: string, suspended: boolean) {
  await requireAdmin();
  await connectDB();
  await User.findByIdAndUpdate(userId, { suspended });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminSetRole(userId: string, role: UserRole) {
  await requireAdmin();
  await connectDB();
  await User.findByIdAndUpdate(userId, { role });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminCreateCoupon(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const code = (formData.get("code") as string)?.toUpperCase();
  const discountPct = parseInt(formData.get("discountPct") as string, 10) || undefined;
  const discountFlat = parseInt(formData.get("discountFlat") as string, 10) || undefined;
  const maxUses = parseInt(formData.get("maxUses") as string, 10) || undefined;
  const expiresAtStr = formData.get("expiresAt") as string;

  if (!code) return { error: "Code required" };

  await Coupon.create({
    code,
    discountPct,
    discountFlat,
    maxUses,
    expiresAt: expiresAtStr ? new Date(expiresAtStr) : undefined,
  });

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function adminToggleCoupon(couponId: string, active: boolean) {
  await requireAdmin();
  await connectDB();
  await Coupon.findByIdAndUpdate(couponId, { active });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function adminDeleteReport(reportId: string) {
  await requireAdmin();
  await connectDB();
  const { ProductSkuCost } = await import("@/models");
  await OrderLine.deleteMany({ reportId });
  await ProductSkuCost.deleteMany({ reportId });
  await Report.findByIdAndDelete(reportId);
  revalidatePath("/admin/reports");
  return { success: true };
}
