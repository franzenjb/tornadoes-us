"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { MONTHS, useData } from "@/lib/store";
import type { Tornado } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
);

const EF_COLOR = [
  "#94a3b8", // unk fallback (not used in stacks for >=0)
  "#a3d977", // EF0
  "#fde047", // EF1
  "#fb923c", // EF2
  "#ef4444", // EF3
  "#b91c1c", // EF4
  "#581c87", // EF5
];

function color(ef: number) {
  if (ef < 0) return "#94a3b8";
  return EF_COLOR[ef + 1] ?? "#94a3b8";
}

export function ByYearChart({ rows }: { rows: Tornado[] }) {
  const openDetail = useData((s) => s.openDetail);
  const { data, labels } = useMemo(() => {
    const yrs = new Map<number, number[]>(); // year -> [unk, ef0..ef5]
    for (const r of rows) {
      let arr = yrs.get(r.yr);
      if (!arr) {
        arr = [0, 0, 0, 0, 0, 0, 0];
        yrs.set(r.yr, arr);
      }
      const idx = r.mag < 0 ? 0 : r.mag + 1;
      arr[idx]++;
    }
    const labels = Array.from(yrs.keys()).sort((a, b) => a - b);
    const buckets = ["Unk", "EF0", "EF1", "EF2", "EF3", "EF4", "EF5"];
    return {
      labels,
      data: {
        labels,
        datasets: buckets.map((b, i) => ({
          label: b,
          data: labels.map((y) => yrs.get(y)![i]),
          backgroundColor: color(i - 1),
          stack: "ef",
        })),
      },
    };
  }, [rows]);
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-1 text-sm font-semibold text-slate-700">
        Tornadoes by year (stacked by EF intensity){" "}
        <span className="font-normal text-slate-400">— click a bar</span>
      </div>
      <div className="h-60">
        <Bar
          data={data}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            onClick: (_e, els) => {
              if (!els.length) return;
              const el = els[0];
              const year = labels[el.index];
              const bucket = el.datasetIndex; // 0=Unk,1=EF0..6=EF5
              const sub = rows.filter(
                (r) =>
                  r.yr === year &&
                  (bucket === 0 ? r.mag < 0 : r.mag === bucket - 1),
              );
              const efLabel = bucket === 0 ? "Unknown EF" : `EF${bucket - 1}`;
              openDetail(`${year} · ${efLabel}`, sub);
            },
            plugins: {
              legend: { position: "bottom", labels: { boxWidth: 12 } },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: { stacked: true, ticks: { autoSkip: true, maxRotation: 0 } },
              y: { stacked: true, beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}

export function ByMonthChart({ rows }: { rows: Tornado[] }) {
  const openDetail = useData((s) => s.openDetail);
  const data = useMemo(() => {
    const m = new Array(12).fill(0);
    for (const r of rows) m[r.mo - 1]++;
    return {
      labels: MONTHS,
      datasets: [
        {
          label: "Tornadoes",
          data: m,
          backgroundColor: "#e11d48",
        },
      ],
    };
  }, [rows]);
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-1 text-sm font-semibold text-slate-700">
        Tornadoes by month (selection){" "}
        <span className="font-normal text-slate-400">— click a bar</span>
      </div>
      <div className="h-60">
        <Bar
          data={data}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            onClick: (_e, els) => {
              if (!els.length) return;
              const mo = els[0].index + 1;
              const sub = rows.filter((r) => r.mo === mo);
              openDetail(`${MONTHS[mo - 1]} (current selection)`, sub);
            },
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
}

export function ByStateChart({ rows }: { rows: Tornado[] }) {
  const openDetail = useData((s) => s.openDetail);
  const { data, labels } = useMemo(() => {
    const s = new Map<string, number>();
    for (const r of rows) s.set(r.st, (s.get(r.st) ?? 0) + 1);
    const arr = Array.from(s.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const labels = arr.map((x) => x[0]);
    return {
      labels,
      data: {
        labels,
        datasets: [
          {
            label: "Tornadoes",
            data: arr.map((x) => x[1]),
            backgroundColor: "#0f766e",
          },
        ],
      },
    };
  }, [rows]);
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-1 text-sm font-semibold text-slate-700">
        Top 20 states (selection){" "}
        <span className="font-normal text-slate-400">— click a bar</span>
      </div>
      <div className="h-60">
        <Bar
          data={data}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            onClick: (_e, els) => {
              if (!els.length) return;
              const st = labels[els[0].index];
              const sub = rows.filter((r) => r.st === st);
              openDetail(`${st} (current selection)`, sub);
            },
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
}
