import mongoose, { Schema, models, model } from "mongoose";

export interface ICreditPackage {
  _id: mongoose.Types.ObjectId;
  name: string;
  credits: number;
  priceInPaise: number;
  active: boolean;
  createdAt: Date;
}

const CreditPackageSchema = new Schema<ICreditPackage>(
  {
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    priceInPaise: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CreditPackage =
  models.CreditPackage ?? model<ICreditPackage>("CreditPackage", CreditPackageSchema);
