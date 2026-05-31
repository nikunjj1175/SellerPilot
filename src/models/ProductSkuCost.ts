import mongoose, { Schema, models, model } from "mongoose";

export interface IProductSkuCost {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  sku: string;
  size: string;
  productName: string;
  productCost: number;
  packCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSkuCostSchema = new Schema<IProductSkuCost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true, index: true },
    sku: { type: String, required: true },
    size: { type: String, default: "" },
    productName: { type: String, default: "" },
    productCost: { type: Number, default: 0 },
    packCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSkuCostSchema.index({ reportId: 1, sku: 1, size: 1 }, { unique: true });

export const ProductSkuCost =
  models.ProductSkuCost ?? model<IProductSkuCost>("ProductSkuCost", ProductSkuCostSchema);
