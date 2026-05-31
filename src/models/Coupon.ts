import mongoose, { Schema, models, model } from "mongoose";

export interface ICoupon {
  _id: mongoose.Types.ObjectId;
  code: string;
  discountPct?: number;
  discountFlat?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountPct: Number,
    discountFlat: Number,
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Coupon = models.Coupon ?? model<ICoupon>("Coupon", CouponSchema);
