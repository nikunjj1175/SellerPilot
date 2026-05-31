import mongoose, { Schema, models, model } from "mongoose";

export interface IApiKey {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  active: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastUsedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ApiKey = models.ApiKey ?? model<IApiKey>("ApiKey", ApiKeySchema);
