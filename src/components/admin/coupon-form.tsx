"use client";

import { useTransition } from "react";
import { adminCreateCoupon } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CouponForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await adminCreateCoupon(new FormData(e.currentTarget));
          if (result.error) toast.error(result.error);
          else {
            toast.success("Coupon created");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label>Code</Label>
        <Input name="code" placeholder="SAVE20" required />
      </div>
      <div className="space-y-2">
        <Label>Discount %</Label>
        <Input name="discountPct" type="number" placeholder="20" />
      </div>
      <div className="space-y-2">
        <Label>Flat discount (paise)</Label>
        <Input name="discountFlat" type="number" placeholder="5000 = ₹50" />
      </div>
      <div className="space-y-2">
        <Label>Max uses</Label>
        <Input name="maxUses" type="number" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Expires at</Label>
        <Input name="expiresAt" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create coupon"}
      </Button>
    </form>
  );
}
