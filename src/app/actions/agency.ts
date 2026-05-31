"use server";

import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { generateApiKeyValue, hashApiKey } from "@/lib/api-auth";
import { slugify } from "@/lib/agency";
import { User, Organization, OrganizationMember, SellerStore, ApiKey } from "@/models";
import type { Marketplace } from "@/types/enums";
import { revalidatePath } from "next/cache";

export async function createAgencyOrganization(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Organization name required" };

  await connectDB();

  const existing = await OrganizationMember.findOne({
    userId: session.user.id,
  });
  if (existing) return { error: "You already belong to an organization" };

  let slug = slugify(name);
  const slugTaken = await Organization.findOne({ slug });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

  const org = await Organization.create({
    name,
    slug,
    ownerId: session.user.id,
    plan: "agency",
    maxStores: 25,
  });

  await OrganizationMember.create({
    organizationId: org._id,
    userId: session.user.id,
    role: "OWNER",
  });

  await User.findByIdAndUpdate(session.user.id, { role: "AGENCY" });

  revalidatePath("/dashboard/agency");
  return { success: true, orgId: org._id.toString() };
}

export async function addSellerStore(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  const membership = await OrganizationMember.findOne({
    userId: session.user.id,
    role: { $in: ["OWNER", "MEMBER"] },
  });
  if (!membership) return { error: "Join or create an agency first" };

  const org = await Organization.findById(membership.organizationId);
  if (!org) return { error: "Organization not found" };

  const count = await SellerStore.countDocuments({ organizationId: org._id });
  if (count >= org.maxStores) {
    return { error: `Store limit reached (${org.maxStores})` };
  }

  const name = (formData.get("name") as string)?.trim();
  const marketplace = (formData.get("marketplace") as string) || "MEESHO";
  if (!name) return { error: "Store name required" };

  const store = await SellerStore.create({
    organizationId: org._id,
    name,
    marketplace: marketplace as Marketplace,
    externalSellerId: (formData.get("externalSellerId") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
  });

  revalidatePath("/dashboard/agency");
  return { success: true, storeId: store._id.toString() };
}

export async function createApiKey(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!name?.trim()) return { error: "Key name required" };

  await connectDB();
  const rawKey = generateApiKeyValue();
  const keyHash = hashApiKey(rawKey);

  await ApiKey.create({
    userId: session.user.id,
    name: name.trim(),
    keyHash,
    keyPrefix: rawKey.slice(0, 12) + "...",
  });

  revalidatePath("/dashboard/developer");
  return { success: true, apiKey: rawKey };
}

export async function revokeApiKey(keyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  await ApiKey.updateOne({ _id: keyId, userId: session.user.id }, { active: false });
  revalidatePath("/dashboard/developer");
  return { success: true };
}
