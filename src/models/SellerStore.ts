import mongoose, { Schema, models, model } from "mongoose";
import type { Marketplace } from "@/types/enums";

export interface ISellerStore {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  marketplace: Marketplace;
  externalSellerId?: string;
  contactEmail?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SellerStoreSchema = new Schema<ISellerStore>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    marketplace: {
      type: String,
      enum: ["MEESHO"],
      default: "MEESHO",
    },
    externalSellerId: String,
    contactEmail: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SellerStore =
  models.SellerStore ?? model<ISellerStore>("SellerStore", SellerStoreSchema);
