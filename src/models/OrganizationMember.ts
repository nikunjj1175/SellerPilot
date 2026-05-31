import mongoose, { Schema, models, model } from "mongoose";
import type { OrgMemberRole } from "@/types/enums";

export interface IOrganizationMember {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: OrgMemberRole;
  createdAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["OWNER", "MEMBER"], default: "MEMBER" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMember =
  models.OrganizationMember ??
  model<IOrganizationMember>("OrganizationMember", OrganizationMemberSchema);
