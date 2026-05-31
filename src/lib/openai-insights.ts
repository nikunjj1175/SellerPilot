import type { AiInsightsResult, ProductInsight } from "@/lib/ai-insights";
import type { ParsedOrderLine, ReportSummary } from "@/lib/meesho-parser";
import { generateInsights } from "@/lib/ai-insights";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export function isOpenAiConfigured() {
  return Boolean(OPENAI_API_KEY);
}

export async function generateEnhancedInsights(
  lines: ParsedOrderLine[],
  summary: ReportSummary,
  marketplace: string
): Promise<AiInsightsResult> {
  const baseline = generateInsights(lines, summary);

  if (!OPENAI_API_KEY) {
    return { ...baseline, summary: `${baseline.summary} (Rule-based insights)` };
  }

  const topSkus = lines.slice(0, 50).map((l) => ({
    sku: l.sku,
    product: l.productName,
    profit: l.netProfit,
    return: l.isReturn,
  }));

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are an expert Indian e-commerce seller consultant for Meesho. Respond ONLY with valid JSON.",
          },
          {
            role: "user",
            content: `Analyze this ${marketplace} seller data and return JSON:
{
  "summary": "2-3 sentence executive summary",
  "opportunities": ["tip1", "tip2", "tip3"],
  "products": [{"sku":"","name":"","type":"loss|high_return|high_rto|profitable|opportunity","metric":"","reason":"","recommendation":""}]
}
Data: ${JSON.stringify({ summary, topSkus: topSkus.slice(0, 15) })}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(content) as {
      summary?: string;
      opportunities?: string[];
      products?: ProductInsight[];
    };

    return {
      generatedAt: new Date().toISOString(),
      summary: parsed.summary ?? baseline.summary,
      opportunities: parsed.opportunities?.length ? parsed.opportunities : baseline.opportunities,
      products: parsed.products?.length ? parsed.products.slice(0, 12) : baseline.products,
    };
  } catch (err) {
    console.error("OpenAI insights failed:", err);
    return {
      ...baseline,
      summary: `${baseline.summary} (AI unavailable — using rule-based analysis)`,
    };
  }
}
