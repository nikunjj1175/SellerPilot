import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User, Payment, CreditTransaction, Coupon } from "@/models";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  const valid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    userId: session.user.id,
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "PAID") {
    return NextResponse.json({ success: true, credits: payment.credits });
  }

  payment.status = "PAID";
  payment.razorpayPaymentId = razorpay_payment_id;
  await payment.save();

  await User.findByIdAndUpdate(session.user.id, { $inc: { credits: payment.credits } });
  await CreditTransaction.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    amount: payment.credits,
    type: "PURCHASE",
    description: `Razorpay purchase — ${payment.credits} credits`,
  });

  if (payment.couponCode) {
    await Coupon.updateOne({ code: payment.couponCode }, { $inc: { usedCount: 1 } });
  }

  return NextResponse.json({ success: true, credits: payment.credits });
}
