"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { applyFilters, useData, MONTHS } from "@/lib/store";
import FilterPanel from "@/components/FilterPanel";
import SummaryStats from "@/components/SummaryStats";
import DataTable from "@/components/DataTable";
import { ByYearChart, ByMonthChart, ByStateChart } from "@/components/Charts";
import Findings from "@/components/Findings";
import DetailPanel from "@/components/DetailPanel";

const TornadoMap = dynamic(() => import("@/components/TornadoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const { loaded, error, records, meta, filters, load } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState<"charts" | "map" | "table" | "findings">(
    "charts",
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (loaded ? applyFilters(records, filters) : []),
    [loaded, records, filters],
  );

  const summary = useMemo(() => describe(filters, meta?.yearMin, meta?.yearMax), [
    filters,
    meta,
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              US Tornado Compendium
            </h1>
            <p className="text-xs text-slate-500">
              Every recorded US tornado, 1950–2026 · NOAA SPC + NCEI Storm Events
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {meta && (
              <>
                <div>
                  <span className="font-semibold text-slate-700">
                    {meta.count.toLocaleString()}
                  </span>{" "}
                  total events
                </div>
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-600 hover:underline"
                >
                  source: SPC
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`relative shrink-0 border-r border-slate-200 bg-white transition-all duration-200 ${
            sidebarOpen ? "w-[340px]" : "w-10"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute right-0 top-2 z-10 -mr-3 h-6 w-6 rounded-full border border-slate-300 bg-white text-xs text-slate-600 shadow hover:bg-slate-100"
            title={sidebarOpen ? "Collapse filters" : "Open filters"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {sidebarOpen && (
            <div className="h-[calc(100vh-64px)] overflow-y-auto p-4">
              <FilterPanel />
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-x-hidden p-4">
          {!loaded && !error && (
            <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Loading 70,000+ tornado records… (~2 MB gzipped)
            </div>
          )}
          {error && (
            <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
              Error loading data: {error}
            </div>
          )}
          {loaded && (
            <div className="space-y-4">
              <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold">Report:</span> {summary}
              </div>

              <SummaryStats rows={filtered} />

              <div className="inline-flex w-full flex-wrap gap-1 rounded-lg border border-slate-300 bg-slate-100 p-1 sm:w-auto">
                {(["charts", "map", "table", "findings"] as const).map((t) => {
                  const label =
                    t === "charts"
                      ? "📊 Charts"
                      : t === "map"
                        ? "🗺️ Map"
                        : t === "table"
                          ? "▦ Table"
                          : "★ 20 Findings";
                  const on = tab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      aria-pressed={on}
                      className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                        on
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {tab === "charts" && (
                <div className="grid gap-3 lg:grid-cols-2">
                  <ByYearChart rows={filtered} />
                  <ByMonthChart rows={filtered} />
                  <div className="lg:col-span-2">
                    <ByStateChart rows={filtered} />
                  </div>
                </div>
              )}
              {tab === "map" && <TornadoMap rows={filtered} />}
              {tab === "table" && <DataTable rows={filtered} />}
              {tab === "findings" && <Findings records={records} />}
            </div>
          )}
        </main>

        <DetailPanel />
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
        Data: NOAA Storm Prediction Center · Tornado paths simplified for
        visualization · Built by Dragon
      </footer>
    </div>
  );
}

function describe(
  f: ReturnType<typeof useData.getState>["filters"],
  yMin?: number,
  yMax?: number,
): string {
  const parts: string[] = [];
  if (f.months.length === 0) {
    parts.push("All months");
  } else if (f.months.length === 12) {
    parts.push("All months");
  } else {
    parts.push(f.months.map((m) => MONTHS[m - 1]).join(", "));
  }
  if (yMin === f.yearMin && yMax === f.yearMax) {
    parts.push(`${f.yearMin}–${f.yearMax} (full record)`);
  } else if (f.yearMin === f.yearMax) {
    parts.push(`${f.yearMin}`);
  } else {
    parts.push(`${f.yearMin}–${f.yearMax}`);
  }
  if (f.states.length) parts.push(f.states.join(", "));
  if (f.county) parts.push(`county like "${f.county}"`);
  if (f.magMin > -9 || f.magMax < 5) {
    parts.push(`EF${Math.max(0, f.magMin)}–EF${f.magMax}`);
  }
  if (f.fatMin > 0) parts.push(`≥${f.fatMin} death${f.fatMin > 1 ? "s" : ""}`);
  if (f.injMin > 0) parts.push(`≥${f.injMin} injuries`);
  return parts.join(" · ");
}
