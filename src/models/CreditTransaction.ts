import mongoose, { Schema, models, model } from "mongoose";
import type { TransactionType } from "@/types/enums";

export interface ICreditTransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  description?: string;
  reportId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["PURCHASE", "USAGE", "REFUND", "ADMIN_GRANT"],
      required: true,
    },
    description: String,
    reportId: { type: Schema.Types.ObjectId, ref: "Report" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CreditTransaction =
  models.CreditTransaction ??
  model<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
