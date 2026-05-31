import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getAgencyDashboardData } from "@/lib/agency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AgencySetup } from "@/components/agency/agency-setup";
import { AddStoreForm } from "@/components/agency/add-store-form";
import { formatINR, formatPct } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Building2, Store } from "lucide-react";

export default async function AgencyPage() {
  const session = await requireSession();
  const data = await getAgencyDashboardData(session.user.id);

  if (!data) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Agency Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage multiple seller stores — perfect for agencies & consultants
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your agency</CardTitle>
            <CardDescription>Up to 25 stores on the agency plan</CardDescription>
          </CardHeader>
          <CardContent>
            <AgencySetup />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization, storeStats, totals } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">
            Agency · {totals.stores} stores · {totals.reports} reports this month
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/reports">Upload for a store</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Combined revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Combined profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatINR(totals.profit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.stores}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Seller stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storeStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add your first client store below.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Store</th>
                    <th className="pb-2 pr-4">Marketplace</th>
                    <th className="pb-2 pr-4">Revenue</th>
                    <th className="pb-2 pr-4">Profit</th>
                    <th className="pb-2">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {storeStats.map(({ store, revenue, profit, returnRate }) => (
                    <tr key={store._id.toString()} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{store.name}</td>
                      <td className="py-3 pr-4">{store.marketplace}</td>
                      <td className="py-3 pr-4">{formatINR(revenue)}</td>
                      <td className={`py-3 pr-4 ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatINR(profit)}
                      </td>
                      <td className="py-3">{formatPct(returnRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add seller store</CardTitle>
        </CardHeader>
        <CardContent>
          <AddStoreForm />
        </CardContent>
      </Card>
    </div>
  );
}
