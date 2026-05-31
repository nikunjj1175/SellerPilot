"use client";

import { useTransition } from "react";
import { generateAiInsights } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { AiInsightsResult } from "@/lib/ai-insights";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, Truck } from "lucide-react";

const typeIcons = {
  loss: TrendingDown,
  high_return: AlertTriangle,
  high_rto: Truck,
  profitable: TrendingUp,
  opportunity: Sparkles,
};

export function InsightsPanel({
  reportId,
  reportName,
  insights,
  credits,
}: {
  reportId: string;
  reportName: string;
  insights: AiInsightsResult | null;
  credits: number;
}) {
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const result = await generateAiInsights(reportId);
      if (result.error) toast.error(result.error);
      else toast.success("AI insights generated!");
    });
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights — {reportName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Analyze loss-making products, high returns, RTO patterns and growth opportunities. Costs 5 credits.
          </p>
          <Button onClick={generate} disabled={pending || credits < 5}>
            {pending ? "Analyzing..." : "Generate insights (5 credits)"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{insights.summary}</p>
          <ul className="mt-4 space-y-2">
            {insights.opportunities.map((o, i) => (
              <li key={i} className="text-sm text-primary flex gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                {o}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.products.map((p) => {
          const Icon = typeIcons[p.type] ?? Sparkles;
          return (
            <Card key={`${p.sku}-${p.type}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {p.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{p.type.replace("_", " ")} · {p.metric}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Reason:</strong> {p.reason}</p>
                <p className="text-muted-foreground"><strong>Tip:</strong> {p.recommendation}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={generate} disabled={pending}>
        Regenerate (5 credits)
      </Button>
    </div>
  );
}
