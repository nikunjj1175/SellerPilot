"use client";

import { useTransition } from "react";
import { adminToggleCoupon } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function CouponToggle({ couponId, active }: { couponId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={active ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminToggleCoupon(couponId, !active);
        })
      }
    >
      {active ? "Disable" : "Enable"}
    </Button>
  );
}
