"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signIn } from "@/auth";
import { homePathForRole } from "@/lib/auth-redirect";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "Password must include at least one letter and one number." };
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) return { error: "Email already registered." };

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, credits: 10 });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard/reports" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration done. Please sign in." };
    }
    throw error;
  }
}

export async function loginUser(formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase();
  const password = formData.get("password") as string;

  await connectDB();
  const existing = await User.findOne({ email }).select("role").lean<{ role?: string } | null>();
  const redirectTo = homePathForRole(existing?.role);

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
