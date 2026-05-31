import Link from "next/link";
import { getDemoReportData } from "@/lib/demo-report";
import { ReportDetailView } from "@/components/dashboard/report-detail-view";
import { MeshBackground } from "@/components/landing/mesh-background";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Demo Report — SellerPilot | Free Preview",
  description:
    "Free demo Meesho P&L report — state-wise map, SKU analytics, returns, RTO & AI insights. No login or credits needed.",
};

export default async function DemoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const data = getDemoReportData();
  const stateCount = data.ordersByState.length;
  const totalOrders = data.summary.totalOrders;

  return (
    <div className="relative min-h-screen">
      <MeshBackground />
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display font-bold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-primary-foreground text-sm shadow-md">
              S
            </span>
            SellerPilot
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/sample-meesho.csv" download>
                <Download className="h-4 w-4 mr-1" />
                Sample CSV
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">
                <Sparkles className="h-4 w-4 mr-1" />
                Get started free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent glass">
          <CardContent className="py-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold">
                100% Free · No login · No credits
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">
                Demo Report Preview
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Purchase / upload karva pahela aa sample report joi lo — P&L, state map ({stateCount}{" "}
                states, {totalOrders} orders), SKU table, returns, RTO ane AI insights.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/register">Register — 10 free credits</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Already have account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <ReportDetailView data={data} defaultTab={tab} />
      </main>
    </div>
  );
}
