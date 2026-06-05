import { connectDB } from "@/lib/mongodb";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponToggle } from "@/components/admin/coupon-toggle";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminCouponsPage() {
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean<ICoupon[]>();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Coupons" description="Create and manage credit discount codes." />

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Create coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">All coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No coupons yet.</p>
          ) : (
            coupons.map((c) => (
              <div
                key={c._id.toString()}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4"
              >
                <div>
                  <p className="font-mono font-semibold text-primary">{c.code}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.discountPct
                      ? `${c.discountPct}% off`
                      : c.discountFlat
                        ? `₹${c.discountFlat / 100} off`
                        : "—"}
                    {" · "}Used {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </p>
                </div>
                <CouponToggle couponId={c._id.toString()} active={c.active} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
