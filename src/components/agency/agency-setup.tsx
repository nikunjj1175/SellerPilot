"use client";

import { useTransition } from "react";
import { createAgencyOrganization } from "@/app/actions/agency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AgencySetup() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await createAgencyOrganization(new FormData(e.currentTarget));
          if (res.error) toast.error(res.error);
          else toast.success("Agency created!");
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Manage multiple Meesho / Flipkart / Amazon stores from one dashboard (Agency plan).
      </p>
      <div className="space-y-2">
        <Label htmlFor="name">Agency / Company name</Label>
        <Input id="name" name="name" placeholder="My Seller Agency" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create agency workspace"}
      </Button>
    </form>
  );
}
