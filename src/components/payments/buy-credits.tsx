"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Package = {
  id: string;
  name: string;
  credits: number;
  priceInPaise: number;
};

export function BuyCredits({ packages, configured }: { packages: Package[]; configured: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const router = useRouter();

  async function loadRazorpay() {
    return new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  }

  async function buy(pkg: Package) {
    if (!configured) {
      toast.error("Razorpay not configured. Add keys in .env");
      return;
    }

    setLoading(pkg.id);
    try {
      await loadRazorpay();

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, couponCode: coupon || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "SellerPilot",
        description: `${data.packageName} — ${data.credits} credits`,
        order_id: data.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verify.json();
          if (verify.ok) {
            toast.success(`${result.credits} credits added!`);
            router.refresh();
          } else {
            toast.error(result.error ?? "Verification failed");
          }
        },
        theme: { color: "#7c3aed" },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="Coupon code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-border p-4 space-y-3">
            <div>
              <p className="font-semibold">{pkg.name}</p>
              <p className="text-2xl font-bold">₹{(pkg.priceInPaise / 100).toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">{pkg.credits} credits</p>
            </div>
            <Button
              className="w-full"
              disabled={!!loading}
              onClick={() => buy(pkg)}
            >
              {loading === pkg.id ? "Processing..." : "Buy now"}
            </Button>
          </div>
        ))}
      </div>
      {!configured && (
        <p className="text-sm text-amber-600">
          Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.
        </p>
      )}
    </div>
  );
}
