import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { Payment, Subscription } from "@/models";
import type { IPayment } from "@/models/Payment";
import type { ISubscription } from "@/models/Subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const session = await requireSession();
  await connectDB();

  const [payments, subscription] = await Promise.all([
    Payment.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("packageId", "name")
      .lean<(IPayment & { packageId?: { name?: string } })[]>(),
    Subscription.findOne({ userId: session.user.id }).lean<ISubscription | null>(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Starter ₹299 · Growth ₹999 · Agency ₹2999/month</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.active ? (
            <p className="text-sm">
              Active plan: <strong>{subscription.plan}</strong>
              {subscription.expiresAt && (
                <> · expires {new Date(subscription.expiresAt).toLocaleDateString("en-IN")}</>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription. Use credits for reports.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>Razorpay credit purchases</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/credits">Buy credits</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {payments.map((p) => {
                const pkg = p.packageId as { name?: string } | null;
                return (
                  <li key={p._id.toString()} className="flex justify-between border-b border-border/50 py-2">
                    <span>
                      {pkg?.name ?? "Credits"} · {p.status}
                    </span>
                    <span>
                      {formatINR(p.amountPaise / 100)} · +{p.credits} credits
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
