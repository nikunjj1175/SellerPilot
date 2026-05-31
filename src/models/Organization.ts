import mongoose, { Schema, models, model } from "mongoose";

export interface IOrganization {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  plan: "starter" | "agency" | "enterprise";
  maxStores: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["starter", "agency", "enterprise"], default: "agency" },
    maxStores: { type: Number, default: 25 },
  },
  { timestamps: true }
);

export const Organization =
  models.Organization ?? model<IOrganization>("Organization", OrganizationSchema);
