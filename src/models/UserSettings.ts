import mongoose, { Schema, models, model } from "mongoose";
import type { Marketplace } from "@/types/enums";

export interface IUserSettings {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  meeshoSellerId?: string;
  meeshoAutoReminder: boolean;
  reminderDayOfMonth: number;
  emailReportsEnabled: boolean;
  whatsappReportsEnabled: boolean;
  whatsappPhone?: string;
  weeklyDigestEnabled: boolean;
  connectedMarketplaces: Marketplace[];
  lastReminderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    meeshoSellerId: String,
    meeshoAutoReminder: { type: Boolean, default: true },
    reminderDayOfMonth: { type: Number, default: 5, min: 1, max: 28 },
    emailReportsEnabled: { type: Boolean, default: true },
    whatsappReportsEnabled: { type: Boolean, default: false },
    whatsappPhone: String,
    weeklyDigestEnabled: { type: Boolean, default: true },
    connectedMarketplaces: {
      type: [String],
      enum: ["MEESHO", "FLIPKART", "AMAZON", "SHOPSY"],
      default: ["MEESHO"],
    },
    lastReminderAt: Date,
  },
  { timestamps: true }
);

export const UserSettings =
  models.UserSettings ?? model<IUserSettings>("UserSettings", UserSettingsSchema);
