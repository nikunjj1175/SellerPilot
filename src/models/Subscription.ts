import mongoose, { Schema, models, model } from "mongoose";

export interface ISubscription {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plan: string;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    plan: { type: String, default: "starter" },
    active: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { timestamps: true }
);

export const Subscription =
  models.Subscription ?? model<ISubscription>("Subscription", SubscriptionSchema);
