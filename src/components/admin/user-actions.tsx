"use client";

import { useTransition } from "react";
import { adminToggleSuspend, adminUpdateUserCredits, adminSetRole } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function UserActions({
  userId,
  suspended,
  role,
}: {
  userId: string;
  suspended: boolean;
  role: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const amount = parseInt(fd.get("amount") as string, 10);
          if (!amount) return;
          startTransition(async () => {
            await adminUpdateUserCredits(userId, amount, "Admin grant");
            toast.success(`Added ${amount} credits`);
          });
        }}
      >
        <Input name="amount" type="number" placeholder="+credits" className="w-24 h-8" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Add
        </Button>
      </form>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await adminToggleSuspend(userId, !suspended);
            toast.success(suspended ? "User activated" : "User suspended");
          })
        }
      >
        {suspended ? "Activate" : "Suspend"}
      </Button>
      {role !== "ADMIN" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await adminSetRole(userId, "ADMIN");
              toast.success("Promoted to admin");
            })
          }
        >
          Make admin
        </Button>
      )}
    </div>
  );
}
