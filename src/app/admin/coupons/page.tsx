import { connectDB } from "@/lib/mongodb";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponToggle } from "@/components/admin/coupon-toggle";

export default async function AdminCouponsPage() {
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean<ICoupon[]>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupon Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-sm">No coupons yet.</p>
          ) : (
            coupons.map((c) => (
              <div
                key={c._id.toString()}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-mono font-semibold">{c.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.discountPct ? `${c.discountPct}% off` : c.discountFlat ? `₹${c.discountFlat / 100} off` : "—"}
                    {" · "}Used {c.usedCount}
                    {c.maxUses ? `/${c.maxUses}` : ""}
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
