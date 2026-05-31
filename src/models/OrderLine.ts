import mongoose, { Schema, models, model } from "mongoose";

export interface IOrderLine {
  _id: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  orderId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  saleAmount: number;
  shipping: number;
  commission: number;
  returnAmount: number;
  rtoAmount: number;
  gst: number;
  netProfit: number;
  isReturn: boolean;
  isRto: boolean;
  orderDate?: Date;
  state?: string;
  pincode?: string;
  orderStatus?: string;
  supplierPrice?: number;
  size?: string;
  productCost?: number;
  packCost?: number;
}

const OrderLineSchema = new Schema<IOrderLine>({
  reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true, index: true },
  orderId: String,
  sku: { type: String, index: true },
  productName: String,
  quantity: { type: Number, default: 1 },
  saleAmount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  returnAmount: { type: Number, default: 0 },
  rtoAmount: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  isReturn: { type: Boolean, default: false },
  isRto: { type: Boolean, default: false },
  orderDate: Date,
  state: { type: String, index: true },
  pincode: String,
  orderStatus: String,
  supplierPrice: { type: Number, default: 0 },
  size: String,
  productCost: { type: Number, default: 0 },
  packCost: { type: Number, default: 0 },
});

export const OrderLine = models.OrderLine ?? model<IOrderLine>("OrderLine", OrderLineSchema);
