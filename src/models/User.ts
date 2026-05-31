import mongoose, { Schema, models, model } from "mongoose";
import type { UserRole } from "@/types/enums";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  passwordHash?: string;
  role: UserRole;
  credits: number;
  suspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: Date,
    image: String,
    passwordHash: String,
    role: { type: String, enum: ["USER", "ADMIN", "AGENCY"], default: "USER" },
    credits: { type: Number, default: 10 },
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = models.User ?? model<IUser>("User", UserSchema);
