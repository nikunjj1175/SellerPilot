import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthUserFromRequest, unauthorizedJson } from "@/lib/auth-jwt";
import { connectDB } from "@/lib/mongodb";
import { CreditPackage, Coupon, Payment } from "@/models";
import { createRazorpayOrder, getRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(req: Request) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return unauthorizedJson();

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

  const { packageId, couponCode } = await req.json();

  await connectDB();
  const pkg = await CreditPackage.findOne({ _id: packageId, active: true });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  let amountPaise = pkg.priceInPaise;
  if (couponCode) {
    const code = String(couponCode).toUpperCase();
    const coupon = await Coupon.findOne({
      code,
      active: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    if (coupon) {
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
      }
      if (coupon.discountPct) {
        amountPaise = Math.round(amountPaise * (1 - coupon.discountPct / 100));
      } else if (coupon.discountFlat) {
        amountPaise = Math.max(100, amountPaise - coupon.discountFlat);
      }
    }
  }

  const receipt = `sp_${user.id.slice(0, 8)}_${Date.now()}`;
  const order = await createRazorpayOrder(amountPaise, receipt);

  await Payment.create({
    userId: new mongoose.Types.ObjectId(user.id),
    packageId: pkg._id,
    razorpayOrderId: order.id,
    amountPaise,
    credits: pkg.credits,
    couponCode: couponCode ? String(couponCode).toUpperCase() : undefined,
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: getRazorpayKeyId(),
    packageName: pkg.name,
    credits: pkg.credits,
  });
}
