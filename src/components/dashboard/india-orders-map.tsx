"use client";

import { useMemo, useState } from "react";
import indiaMap from "@svg-maps/india";
import type { StateOrderStats } from "@/lib/meesho-parser";
import { formatINR } from "@/lib/utils";

/** Map SellerPilot state names → @svg-maps/india location names */
const STATE_TO_MAP: Record<string, string> = {
  Maharashtra: "Maharashtra",
  Gujarat: "Gujarat",
  Karnataka: "Karnataka",
  "Tamil Nadu": "Tamil Nadu",
  Delhi: "NCT of Delhi",
  "Uttar Pradesh": "Uttar Pradesh",
  "West Bengal": "West Bengal",
  Rajasthan: "Rajasthan",
  Telangana: "Telangana",
  Kerala: "Kerala",
  Punjab: "Punjab",
  "Madhya Pradesh": "Madhya Pradesh",
  "Andhra Pradesh": "Andhra Pradesh",
  Bihar: "Bihar",
  Haryana: "Haryana",
  Odisha: "Odisha",
  Jharkhand: "Jharkhand",
  Assam: "Assam",
  Chhattisgarh: "Chhattisgarh",
  Goa: "Goa",
  Uttarakhand: "Uttarakhand",
  "Himachal Pradesh": "Himachal Pradesh",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "Jammu and Kashmir": "Jammu and Kashmir",
  Ladakh: "Ladakh",
  Sikkim: "Sikkim",
  "Arunachal Pradesh": "Arunachal Pradesh",
  Manipur: "Manipur",
  Meghalaya: "Meghalaya",
  Mizoram: "Mizoram",
  Nagaland: "Nagaland",
  Tripura: "Tripura",
  Puducherry: "Puducherry",
  Chandigarh: "Chandigarh",
};

type Props = {
  data: StateOrderStats[];
  className?: string;
  showTable?: boolean;
};

type MapLocation = { id: string; name: string; path: string };

export function IndiaOrdersMap({ data, className, showTable = true }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const statsByMapName = useMemo(() => {
    const map = new Map<string, StateOrderStats>();
    for (const d of data) {
      const mapName = STATE_TO_MAP[d.state] ?? d.state;
      const existing = map.get(mapName);
      if (existing) {
        map.set(mapName, {
          state: d.state,
          orderCount: existing.orderCount + d.orderCount,
          revenue: existing.revenue + d.revenue,
          returnCount: existing.returnCount + d.returnCount,
          rtoCount: existing.rtoCount + d.rtoCount,
        });
      } else {
        map.set(mapName, { ...d });
      }
    }
    return map;
  }, [data]);

  const maxOrders = useMemo(
    () => Math.max(...data.map((d) => d.orderCount), 1),
    [data]
  );
  const totalOrders = useMemo(() => data.reduce((s, d) => s + d.orderCount, 0), [data]);

  const hoveredStats = useMemo(() => {
    if (!hovered) return null;
    return statsByMapName.get(hovered) ?? null;
  }, [hovered, statsByMapName]);

  const locations = indiaMap.locations as MapLocation[];

  function fillForLocation(name: string) {
    const stats = statsByMapName.get(name);
    if (!stats) return "color-mix(in srgb, var(--muted) 80%, var(--background))";
    const intensity = 0.25 + (stats.orderCount / maxOrders) * 0.75;
    return `color-mix(in srgb, var(--primary) ${Math.round(intensity * 100)}%, var(--background))`;
  }

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-border/80 bg-gradient-to-br from-slate-50/50 to-primary/5 dark:from-slate-900/30 dark:to-primary/10 p-3 sm:p-5 overflow-hidden">
        <div className="absolute top-3 right-3 z-10 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs shadow-sm">
          <span className="text-muted-foreground">Total: </span>
          <strong className="text-primary">{totalOrders}</strong>
          <span className="text-muted-foreground"> orders · {data.length} states</span>
        </div>

        <svg
          viewBox={indiaMap.viewBox}
          className="w-full h-auto max-h-[480px]"
          role="img"
          aria-label="India state-wise orders choropleth map"
        >
          {locations.map((loc) => {
            const stats = statsByMapName.get(loc.name);
            const isHovered = hovered === loc.name;
            const hasOrders = Boolean(stats?.orderCount);

            return (
              <path
                key={loc.id}
                id={loc.id}
                d={loc.path}
                fill={isHovered ? "var(--primary)" : fillForLocation(loc.name)}
                fillOpacity={isHovered ? 0.9 : hasOrders ? 1 : 0.45}
                stroke="color-mix(in srgb, var(--foreground) 20%, transparent)"
                strokeWidth={isHovered ? 1.2 : 0.4}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHovered(loc.name)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {hoveredStats ? (
          <div className="absolute left-3 top-12 z-20 rounded-xl border border-primary/40 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md min-w-[220px]">
            <p className="font-semibold font-bold text-lg text-primary">{hoveredStats.state}</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Orders: </span>
                <strong className="text-xl text-foreground">{hoveredStats.orderCount}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Revenue: </span>
                {formatINR(hoveredStats.revenue)}
              </p>
              <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                Returns: {hoveredStats.returnCount} · RTO: {hoveredStats.rtoCount}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground mt-2">
            State par hover karo — aa state na ketla orders che te dekhashe
          </p>
        )}

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span>Low</span>
          <div className="h-2 w-32 rounded-full bg-gradient-to-r from-muted via-primary/40 to-primary" />
          <span>High orders</span>
        </div>
      </div>

      {showTable && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">Orders</th>
                <th className="px-4 py-2.5 font-medium">Revenue</th>
                <th className="px-4 py-2.5 font-medium">Returns</th>
                <th className="px-4 py-2.5 font-medium">RTO</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr
                  key={d.state}
                  className={`border-b border-border/50 transition-colors ${
                    hovered === (STATE_TO_MAP[d.state] ?? d.state)
                      ? "bg-primary/10"
                      : "hover:bg-muted/30"
                  }`}
                  onMouseEnter={() => setHovered(STATE_TO_MAP[d.state] ?? d.state)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{d.state}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                      {d.orderCount}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{formatINR(d.revenue)}</td>
                  <td className="px-4 py-2.5 text-amber-600">{d.returnCount}</td>
                  <td className="px-4 py-2.5 text-red-500">{d.rtoCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
