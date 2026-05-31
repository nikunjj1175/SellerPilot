import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { User, CreditTransaction, CreditPackage } from "@/models";
import type { ICreditTransaction } from "@/models/CreditTransaction";
import type { ICreditPackage } from "@/models/CreditPackage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CREDIT_COSTS } from "@/lib/credits";
import { BuyCredits } from "@/components/payments/buy-credits";
import { isRazorpayConfigured } from "@/lib/razorpay";

export default async function CreditsPage() {
  const session = await requireSession();
  await connectDB();

  const user = await User.findById(session.user.id);
  const transactions = await CreditTransaction.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean<ICreditTransaction[]>();
  const packages = await CreditPackage.find({ active: true }).lean<ICreditPackage[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credit Wallet</h1>
        <p className="text-muted-foreground">Current balance: {user?.credits ?? 0} credits</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <BuyCredits
            packages={packages.map((p) => ({
              id: p._id.toString(),
              name: p.name,
              credits: p.credits,
              priceInPaise: p.priceInPaise,
            }))}
            configured={isRazorpayConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(CREDIT_COSTS).map(([key, cost]) => (
            <div key={key} className="flex justify-between rounded-lg border border-border p-3">
              <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
              <span className="font-medium">{cost} credits</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {transactions.map((tx) => (
                <li key={tx._id.toString()} className="flex justify-between border-b border-border/50 py-2">
                  <span>{tx.description ?? tx.type}</span>
                  <span className={tx.amount > 0 ? "text-emerald-600" : "text-red-500"}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
