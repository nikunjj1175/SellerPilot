import mongoose, { Schema, models, model } from "mongoose";

export interface IRefreshToken {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  jti: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshToken =
  models.RefreshToken ?? model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
