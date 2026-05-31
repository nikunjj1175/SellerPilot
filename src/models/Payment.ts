import mongoose, { Schema, models, model } from "mongoose";
import type { PaymentStatus } from "@/types/enums";

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  credits: number;
  status: PaymentStatus;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: "CreditPackage" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    amountPaise: { type: Number, required: true },
    credits: { type: Number, required: true },
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "REFUNDED"],
      default: "CREATED",
    },
    couponCode: String,
  },
  { timestamps: true }
);

export const Payment = models.Payment ?? model<IPayment>("Payment", PaymentSchema);
