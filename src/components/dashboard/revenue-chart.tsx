"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  name: string;
  revenue: number;
  profit: number;
};

export function RevenueChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Upload a report to see trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`₹${Number(value ?? 0).toLocaleString("en-IN")}`, ""]}
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#revenue)" name="Revenue" />
        <Area type="monotone" dataKey="profit" stroke="#10b981" fill="transparent" name="Profit" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
