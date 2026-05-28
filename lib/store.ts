"use client";
import { create } from "zustand";
import type { Meta, Tornado } from "./types";

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Filters = {
  months: number[]; // 1..12
  yearMin: number;
  yearMax: number;
  states: string[];
  county: string; // single county name (within selected states), "" = any
  magMin: number; // -9 includes unknowns
  magMax: number; // 5
  injMin: number;
  fatMin: number;
};

type DataState = {
  loaded: boolean;
  error?: string;
  records: Tornado[];
  meta?: Meta;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  load: () => Promise<void>;
};

const defaultFilters = (yMin = 1950, yMax = 2026): Filters => ({
  months: [],
  yearMin: yMin,
  yearMax: yMax,
  states: [],
  county: "",
  magMin: -9,
  magMax: 5,
  injMin: 0,
  fatMin: 0,
});

export const useData = create<DataState>((set, get) => ({
  loaded: false,
  records: [],
  filters: defaultFilters(),
  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  resetFilters: () => {
    const m = get().meta;
    set({ filters: defaultFilters(m?.yearMin, m?.yearMax) });
  },
  load: async () => {
    if (get().loaded) return;
    try {
      const [mRes, dRes] = await Promise.all([
        fetch("/data/meta.json"),
        fetch("/data/tornadoes.json"),
      ]);
      const meta: Meta = await mRes.json();
      const records: Tornado[] = await dRes.json();
      set({
        meta,
        records,
        loaded: true,
        filters: defaultFilters(meta.yearMin, meta.yearMax),
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));

export function applyFilters(records: Tornado[], f: Filters): Tornado[] {
  const monthSet = f.months.length ? new Set(f.months) : null;
  const stateSet = f.states.length ? new Set(f.states) : null;
  const co = f.county.trim().toLowerCase();
  const out: Tornado[] = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.yr < f.yearMin || r.yr > f.yearMax) continue;
    if (monthSet && !monthSet.has(r.mo)) continue;
    if (stateSet && !stateSet.has(r.st)) continue;
    if (r.mag < f.magMin || r.mag > f.magMax) continue;
    if (r.inj < f.injMin) continue;
    if (r.fat < f.fatMin) continue;
    if (co) {
      let hit = false;
      for (const c of r.co) {
        if (c.toLowerCase().includes(co)) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
    }
    out.push(r);
  }
  return out;
}

export function magLabel(m: number): string {
  if (m < 0) return "Unk";
  return `EF${m}`;
}

/** Whole-dollar amount -> compact, rounded string ($11.5B, $250.0M, $50K, $0). */
export function humanizeUSD(dollars: number): string {
  if (!dollars || dollars <= 0) return "$0";
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(1)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${dollars}`;
}
