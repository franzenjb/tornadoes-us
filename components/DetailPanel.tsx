"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { humanizeUSD, magLabel, useData } from "@/lib/store";
import type { Tornado } from "@/lib/types";

const MIN_W = 320;
const MAX_W = 760;
const DEFAULT_W = 440;
const LS_KEY = "torn-detail-width";

export default function DetailPanel() {
  const {
    detailOpen,
    detailTitle,
    detailRows,
    detailFilter,
    closeDetail,
    setFilters,
    setActiveTab,
  } = useData();
  const [width, setWidth] = useState(DEFAULT_W);
  const dragging = useRef(false);

  // Restore saved width
  useEffect(() => {
    const saved = Number(localStorage.getItem(LS_KEY));
    if (saved >= MIN_W && saved <= MAX_W) setWidth(saved);
  }, []);

  const onMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX));
      setWidth(w);
    };
    const up = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.userSelect = "";
        localStorage.setItem(LS_KEY, String(width));
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [width]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailOpen) closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailOpen, closeDetail]);

  if (!detailOpen) return null;

  const rows = [...detailRows].sort(
    (a, b) => b.fat - a.fat || b.inj - a.inj || b.loss - a.loss,
  );
  const totFat = rows.reduce((s, r) => s + r.fat, 0);
  const totInj = rows.reduce((s, r) => s + r.inj, 0);

  const viewIn = (t: "map" | "table") => {
    if (detailFilter) setFilters(detailFilter);
    setActiveTab(t);
  };

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-slate-300 bg-white shadow-xl"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="absolute left-0 top-0 z-10 h-full w-1.5 -ml-0.5 cursor-col-resize bg-transparent hover:bg-rose-300"
      />
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            Detail
          </div>
          <div className="text-base font-bold leading-tight text-slate-900">
            {detailTitle}
          </div>
          <div className="text-xs text-slate-500">
            {rows.length.toLocaleString()} tornado{rows.length === 1 ? "" : "es"}
            {totFat > 0 && ` · ${totFat.toLocaleString()} deaths`}
            {totInj > 0 && ` · ${totInj.toLocaleString()} injuries`}
          </div>
        </div>
        <button
          onClick={closeDetail}
          aria-label="Close detail panel"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      {detailFilter && (
        <div className="flex gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <span className="self-center text-xs text-slate-500">
            View this slice in:
          </span>
          <button
            onClick={() => viewIn("map")}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            🗺️ Map
          </button>
          <button
            onClick={() => viewIn("table")}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ▦ Table
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {rows.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-slate-500">
            No tornadoes in this slice.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <DetailCard key={r.id} r={r} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function DetailCard({ r }: { r: Tornado }) {
  const date = `${r.yr}-${String(r.mo).padStart(2, "0")}-${String(r.dy).padStart(2, "0")}`;
  const efColor =
    r.mag >= 4
      ? "bg-rose-700 text-white"
      : r.mag >= 2
        ? "bg-orange-500 text-white"
        : r.mag >= 0
          ? "bg-amber-300 text-slate-900"
          : "bg-slate-300 text-slate-700";
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 hover:border-rose-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">
            {date} <span className="font-normal text-slate-500">{r.tm}</span>
          </div>
          <div className="text-sm text-slate-600">
            {r.st}
            {r.co.length ? ` — ${r.co.join(", ")} Co.` : ""}
          </div>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${efColor}`}
        >
          {magLabel(r.mag)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-700">
        <Stat label="Deaths" value={r.fat} highlight={r.fat > 0} />
        <Stat label="Injuries" value={r.inj} />
        <Stat label="Path" value={`${r.len.toFixed(1)} mi`} />
        <Stat label="Width" value={`${r.wid.toLocaleString()} yd`} />
        {r.loss > 0 && <Stat label="Loss" value={humanizeUSD(r.loss)} />}
        <Stat
          label="Start"
          value={`${r.slat.toFixed(2)}, ${r.slon.toFixed(2)}`}
        />
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-medium ${highlight ? "text-rose-700" : "text-slate-800"}`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
