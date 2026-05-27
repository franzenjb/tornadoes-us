"use client";
import { MONTHS, useData } from "@/lib/store";
import { PRESETS } from "@/lib/presets";

export default function FilterPanel() {
  const { meta, filters, setFilters, resetFilters } = useData();
  if (!meta) return null;
  const f = filters;

  const toggleMonth = (m: number) =>
    setFilters({
      months: f.months.includes(m)
        ? f.months.filter((x) => x !== m)
        : [...f.months, m].sort((a, b) => a - b),
    });
  const toggleState = (s: string) =>
    setFilters({
      states: f.states.includes(s)
        ? f.states.filter((x) => x !== s)
        : [...f.states, s].sort(),
    });

  const counties = f.states.length
    ? Array.from(
        new Set(f.states.flatMap((s) => meta.stateCounties[s] ?? [])),
      ).sort()
    : [];

  return (
    <div className="space-y-6 text-sm">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick reports
        </h3>
        <div className="mt-2 grid gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setFilters({
                  ...{
                    months: [],
                    states: [],
                    county: "",
                    magMin: -9,
                    magMax: 5,
                    injMin: 0,
                    fatMin: 0,
                    yearMin: meta.yearMin,
                    yearMax: meta.yearMax,
                  },
                  ...p.build({ yearMin: meta.yearMin, yearMax: meta.yearMax }),
                })
              }
              title={p.hint}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-800 hover:border-rose-400 hover:bg-rose-50"
            >
              <div className="font-medium leading-tight">{p.label}</div>
              <div className="text-xs text-slate-500">{p.hint}</div>
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200"
          >
            Reset all filters
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Years
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={meta.yearMin}
            max={meta.yearMax}
            value={f.yearMin}
            onChange={(e) =>
              setFilters({
                yearMin: Math.max(meta.yearMin, Number(e.target.value) || meta.yearMin),
              })
            }
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1"
          />
          <span className="text-slate-500">to</span>
          <input
            type="number"
            min={meta.yearMin}
            max={meta.yearMax}
            value={f.yearMax}
            onChange={(e) =>
              setFilters({
                yearMax: Math.min(meta.yearMax, Number(e.target.value) || meta.yearMax),
              })
            }
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1"
          />
        </div>
        <div className="mt-2 flex gap-1 text-xs">
          {[5, 10, 20, 30].map((n) => (
            <button
              key={n}
              onClick={() =>
                setFilters({
                  yearMin: Math.max(meta.yearMin, meta.yearMax - (n - 1)),
                  yearMax: meta.yearMax,
                })
              }
              className="rounded border border-slate-300 bg-white px-2 py-0.5 hover:bg-slate-100"
            >
              Last {n}y
            </button>
          ))}
          <button
            onClick={() =>
              setFilters({ yearMin: meta.yearMin, yearMax: meta.yearMax })
            }
            className="rounded border border-slate-300 bg-white px-2 py-0.5 hover:bg-slate-100"
          >
            All
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Months
        </h3>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {MONTHS.map((label, i) => {
            const m = i + 1;
            const on = f.months.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMonth(m)}
                className={`rounded border px-2 py-1 text-xs ${
                  on
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {f.months.length > 0 && (
          <button
            onClick={() => setFilters({ months: [] })}
            className="mt-1 text-xs text-slate-500 hover:text-rose-600"
          >
            Clear months
          </button>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          States
        </h3>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {meta.states.map((s) => {
            const on = f.states.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleState(s)}
                className={`rounded border px-1 py-0.5 text-xs ${
                  on
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {f.states.length > 0 && (
          <button
            onClick={() => setFilters({ states: [], county: "" })}
            className="mt-1 text-xs text-slate-500 hover:text-rose-600"
          >
            Clear states
          </button>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          County
        </h3>
        <input
          type="text"
          list="county-list"
          value={f.county}
          onChange={(e) => setFilters({ county: e.target.value })}
          placeholder={
            f.states.length
              ? `e.g. ${counties[0] ?? "Tulsa"}`
              : "Pick state(s) first or type any"
          }
          className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-1"
        />
        <datalist id="county-list">
          {counties.slice(0, 500).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Intensity (EF/F scale)
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={f.magMin}
            onChange={(e) => setFilters({ magMin: Number(e.target.value) })}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value={-9}>Any (incl. unknown)</option>
            <option value={0}>EF0+</option>
            <option value={1}>EF1+</option>
            <option value={2}>EF2+</option>
            <option value={3}>EF3+</option>
            <option value={4}>EF4+</option>
            <option value={5}>EF5 only</option>
          </select>
          <span className="text-slate-500">to</span>
          <select
            value={f.magMax}
            onChange={(e) => setFilters({ magMax: Number(e.target.value) })}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value={0}>EF0</option>
            <option value={1}>EF1</option>
            <option value={2}>EF2</option>
            <option value={3}>EF3</option>
            <option value={4}>EF4</option>
            <option value={5}>EF5</option>
          </select>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Minimum impact
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-600">
            Injuries ≥
            <input
              type="number"
              min={0}
              value={f.injMin}
              onChange={(e) =>
                setFilters({ injMin: Math.max(0, Number(e.target.value) || 0) })
              }
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <label className="text-xs text-slate-600">
            Deaths ≥
            <input
              type="number"
              min={0}
              value={f.fatMin}
              onChange={(e) =>
                setFilters({ fatMin: Math.max(0, Number(e.target.value) || 0) })
              }
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
