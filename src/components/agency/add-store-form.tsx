"use client";

import { useTransition } from "react";
import { addSellerStore } from "@/app/actions/agency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddStoreForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await addSellerStore(new FormData(e.currentTarget));
          if (res.error) toast.error(res.error);
          else {
            toast.success("Meesho store added");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <input type="hidden" name="marketplace" value="MEESHO" />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="storeName">Store name</Label>
        <Input id="storeName" name="name" placeholder="Client A - Meesho" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="externalSellerId">Meesho Seller ID (optional)</Label>
        <Input id="externalSellerId" name="externalSellerId" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact email (optional)</Label>
        <Input id="contactEmail" name="contactEmail" type="email" />
      </div>
      <Button type="submit" disabled={pending} className="sm:col-span-2 w-fit">
        {pending ? "Adding..." : "Add Meesho store"}
      </Button>
    </form>
  );
}
