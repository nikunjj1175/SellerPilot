import { connectDB } from "@/lib/mongodb";
import { Payment, type IPayment } from "@/models/Payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatINR } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await connectDB();

  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(80)
    .populate("userId", "email name")
    .populate("packageId", "name")
    .lean<(IPayment & { userId?: { email?: string; name?: string }; packageId?: { name?: string } })[]>();

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amountPaise, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description={`Razorpay orders — total paid ${formatINR(totalPaid / 100)}`}
      />

      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Package</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Credits</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const user = p.userId as { email?: string; name?: string } | null;
                const pkg = p.packageId as { name?: string } | null;
                return (
                  <tr key={p._id.toString()} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-4">
                      <p className="font-medium">{user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? "—"}</p>
                    </td>
                    <td className="p-4">{pkg?.name ?? "—"}</td>
                    <td className="p-4 font-semibold tabular-nums">{formatINR(p.amountPaise / 100)}</td>
                    <td className="p-4 tabular-nums">{p.credits}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full text-xs px-2 py-0.5 font-medium ${
                          p.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString("en-IN")}
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
