import { connectDB } from "@/lib/mongodb";
import { Payment, type IPayment } from "@/models/Payment";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await connectDB();

  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("userId", "email")
    .populate("packageId", "name")
    .lean<(IPayment & { userId?: { email?: string }; packageId?: { name?: string } })[]>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4">User</th>
                <th className="p-4">Package</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const user = p.userId as { email?: string } | null;
                const pkg = p.packageId as { name?: string } | null;
                return (
                  <tr key={p._id.toString()} className="border-b border-border/50">
                    <td className="p-4">{user?.email ?? "—"}</td>
                    <td className="p-4">{pkg?.name ?? "—"}</td>
                    <td className="p-4">{formatINR(p.amountPaise / 100)}</td>
                    <td className="p-4">{p.credits}</td>
                    <td className="p-4">{p.status}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
