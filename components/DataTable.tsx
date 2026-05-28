"use client";
import { useMemo, useState } from "react";
import type { Tornado } from "@/lib/types";
import { magLabel, humanizeUSD } from "@/lib/store";

type Col = {
  key: keyof Tornado | "date" | "county";
  label: string;
  align?: "right" | "left";
  fmt?: (r: Tornado) => string;
  sort: (a: Tornado, b: Tornado) => number;
};

const COLS: Col[] = [
  {
    key: "date",
    label: "Date",
    fmt: (r) =>
      `${r.yr}-${String(r.mo).padStart(2, "0")}-${String(r.dy).padStart(2, "0")}`,
    sort: (a, b) =>
      a.yr - b.yr || a.mo - b.mo || a.dy - b.dy || a.tm.localeCompare(b.tm),
  },
  { key: "tm", label: "Time", fmt: (r) => r.tm, sort: (a, b) => a.tm.localeCompare(b.tm) },
  { key: "st", label: "St", fmt: (r) => r.st, sort: (a, b) => a.st.localeCompare(b.st) },
  {
    key: "county",
    label: "County",
    fmt: (r) => r.co.join(", "),
    sort: (a, b) => (a.co[0] ?? "").localeCompare(b.co[0] ?? ""),
  },
  {
    key: "mag",
    label: "EF",
    align: "right",
    fmt: (r) => magLabel(r.mag),
    sort: (a, b) => a.mag - b.mag,
  },
  {
    key: "fat",
    label: "Deaths",
    align: "right",
    fmt: (r) => String(r.fat),
    sort: (a, b) => a.fat - b.fat,
  },
  {
    key: "inj",
    label: "Inj",
    align: "right",
    fmt: (r) => String(r.inj),
    sort: (a, b) => a.inj - b.inj,
  },
  {
    key: "len",
    label: "Mi",
    align: "right",
    fmt: (r) => r.len.toFixed(1),
    sort: (a, b) => a.len - b.len,
  },
  {
    key: "wid",
    label: "Width (yd)",
    align: "right",
    fmt: (r) => String(r.wid),
    sort: (a, b) => a.wid - b.wid,
  },
  {
    key: "loss",
    label: "Property loss",
    align: "right",
    fmt: (r) => (r.loss ? humanizeUSD(r.loss) : "—"),
    sort: (a, b) => a.loss - b.loss,
  },
];

const PAGE = 100;

export default function DataTable({ rows }: { rows: Tornado[] }) {
  const [sortKey, setSortKey] = useState<string>("date");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const c = COLS.find((x) => x.key === sortKey) ?? COLS[0];
    const arr = rows.slice();
    arr.sort((a, b) => c.sort(a, b) * dir);
    return arr;
  }, [rows, sortKey, dir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = sorted.slice(safePage * PAGE, safePage * PAGE + PAGE);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="text-sm font-semibold text-slate-700">
          Events ({sorted.length.toLocaleString()})
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <button
            onClick={() => downloadCsv(sorted)}
            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50"
          >
            Download CSV
          </button>
          <span>
            Page {safePage + 1}/{pages}
          </span>
          <button
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="rounded border border-slate-300 bg-white px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
            className="rounded border border-slate-300 bg-white px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key as string}
                  onClick={() => {
                    if (sortKey === c.key) setDir(dir === 1 ? -1 : 1);
                    else {
                      setSortKey(c.key as string);
                      setDir(c.align === "right" ? -1 : 1);
                    }
                    setPage(0);
                  }}
                  className={`cursor-pointer select-none border-b border-slate-200 px-2 py-1.5 text-${c.align ?? "left"} font-semibold hover:bg-slate-200`}
                >
                  {c.label}
                  {sortKey === c.key ? (dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                {COLS.map((c) => (
                  <td
                    key={c.key as string}
                    className={`border-b border-slate-100 px-2 py-1 text-${c.align ?? "left"} ${c.key === "fat" && r.fat > 0 ? "font-semibold text-rose-700" : ""}`}
                  >
                    {c.fmt!(r)}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td
                  colSpan={COLS.length}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No tornadoes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function downloadCsv(rows: Tornado[]) {
  const header = [
    "id","date","time","state","county","ef","deaths","injuries",
    "property_loss_usd","length_mi","width_yd","start_lat","start_lon","end_lat","end_lon",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const date = `${r.yr}-${String(r.mo).padStart(2,"0")}-${String(r.dy).padStart(2,"0")}`;
    const county = `"${r.co.join("; ").replace(/"/g, '""')}"`;
    lines.push([
      r.id, date, r.tm, r.st, county,
      magLabel(r.mag), r.fat, r.inj, r.loss, r.len, r.wid,
      r.slat, r.slon, r.elat, r.elon,
    ].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tornadoes-${rows.length}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
