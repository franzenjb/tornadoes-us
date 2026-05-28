"use client";
import type { Tornado } from "@/lib/types";
import { humanizeUSD } from "@/lib/store";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function SummaryStats({ rows }: { rows: Tornado[] }) {
  let inj = 0,
    fat = 0,
    loss = 0,
    violent = 0,
    pathMi = 0;
  for (const r of rows) {
    inj += r.inj;
    fat += r.fat;
    loss += r.loss;
    if (r.mag >= 4) violent++;
    pathMi += r.len;
  }
  const cards: { label: string; value: string; sub?: string }[] = [
    { label: "Tornadoes", value: fmt(rows.length) },
    { label: "Fatalities", value: fmt(fat) },
    { label: "Injuries", value: fmt(inj) },
    { label: "EF4 + EF5", value: fmt(violent), sub: "violent tornadoes" },
    {
      label: "Path length",
      value: `${fmt(Math.round(pathMi))} mi`,
      sub: "cumulative",
    },
    {
      label: "Property loss",
      value: humanizeUSD(loss),
      sub: "reported, 1996+",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {c.label}
          </div>
          <div className="mt-0.5 text-xl font-semibold text-slate-900">
            {c.value}
          </div>
          {c.sub && (
            <div className="text-[11px] text-slate-500">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
