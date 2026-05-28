"use client";
import { useMemo } from "react";
import type { Tornado } from "@/lib/types";
import { humanizeUSD, MONTHS } from "@/lib/store";

type Finding = {
  n: number;
  stat: string;
  headline: string;
  detail: string;
};

const STATE_NAME: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",
  CT:"Connecticut",DE:"Delaware",DC:"D.C.",FL:"Florida",GA:"Georgia",HI:"Hawaii",
  ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",
  ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",
  MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",
  WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",PR:"Puerto Rico",VI:"Virgin Islands",
};
const sName = (s: string) => STATE_NAME[s] ?? s;
const N = (n: number) => n.toLocaleString();
const fdate = (r: Tornado) =>
  `${MONTHS[r.mo - 1]} ${r.dy}, ${r.yr}`;

function topEntry<T>(m: Map<T, number>): [T, number] {
  let bk: T | null = null, bv = -1;
  for (const [k, v] of m) if (v > bv) { bv = v; bk = k; }
  return [bk as T, bv];
}

export default function Findings({ records }: { records: Tornado[] }) {
  const findings = useMemo(() => compute(records), [records]);
  return (
    <div>
      <div className="mb-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        <span className="font-semibold">20 findings</span> computed from the full{" "}
        {records.length ? `${records[0].yr}–${records[records.length - 1].yr}` : ""}{" "}
        record ({N(records.length)} tornadoes). Independent of the filters on the left.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {findings.map((f) => (
          <div
            key={f.n}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
              {String(f.n).padStart(2, "0")} · {f.headline}
            </div>
            <div className="mt-1 h-[3px] w-10 bg-rose-600" />
            <div className="mt-2 text-2xl font-bold leading-tight text-slate-900">
              {f.stat}
            </div>
            <div className="mt-1 text-sm text-slate-600">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function compute(recs: Tornado[]): Finding[] {
  const out: Finding[] = [];
  if (!recs.length) return out;

  const yMin = recs[0].yr;
  const yMax = recs[recs.length - 1].yr;

  let totFat = 0, totInj = 0, totLoss = 0, ef5 = 0, violent = 0, weak = 0;
  let violentFat = 0;
  const byYear = new Map<number, number>();
  const byYearFat = new Map<number, number>();
  const byMonth = new Map<number, number>();
  const byState = new Map<string, number>();
  const byStateFat = new Map<string, number>();
  const byDay = new Map<string, number>();
  const byDayFat = new Map<string, number>();
  const ef5ByState = new Map<string, number>();
  let deadliest = recs[0], longest = recs[0], widest = recs[0], costliest = recs[0];
  const ef5List: Tornado[] = [];

  for (const r of recs) {
    totFat += r.fat; totInj += r.inj; totLoss += r.loss;
    if (r.mag === 5) { ef5++; ef5ByState.set(r.st, (ef5ByState.get(r.st) ?? 0) + 1);
      ef5List.push(r); }
    if (r.mag >= 4) { violent++; violentFat += r.fat; }
    if (r.mag >= 0 && r.mag <= 1) weak++;
    byYear.set(r.yr, (byYear.get(r.yr) ?? 0) + 1);
    byYearFat.set(r.yr, (byYearFat.get(r.yr) ?? 0) + r.fat);
    byMonth.set(r.mo, (byMonth.get(r.mo) ?? 0) + 1);
    byState.set(r.st, (byState.get(r.st) ?? 0) + 1);
    byStateFat.set(r.st, (byStateFat.get(r.st) ?? 0) + r.fat);
    const dk = `${r.yr}-${r.mo}-${r.dy}`;
    byDay.set(dk, (byDay.get(dk) ?? 0) + 1);
    byDayFat.set(dk, (byDayFat.get(dk) ?? 0) + r.fat);
    if (r.fat > deadliest.fat) deadliest = r;
    if (r.len > longest.len) longest = r;
    if (r.wid > widest.wid) widest = r;
    if (r.loss > costliest.loss) costliest = r;
  }

  const [busyYear, busyYearN] = topEntry(byYear);
  const [deadYear, deadYearN] = topEntry(byYearFat);
  const [peakMonth, peakMonthN] = topEntry(byMonth);
  const [topState, topStateN] = topEntry(byState);
  const [topStateFatK, topStateFatV] = topEntry(byStateFat);
  const [topEf5State, topEf5StateN] = topEntry(ef5ByState);
  const [busyDay, busyDayN] = topEntry(byDay);
  const [deadDay, deadDayN] = topEntry(byDayFat);

  const recsByDayLabel = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  };

  // decade trend
  const decade = (y: number) => Math.floor(y / 10) * 10;
  const byDec = new Map<number, number>();
  for (const r of recs) byDec.set(decade(r.yr), (byDec.get(decade(r.yr)) ?? 0) + 1);
  const firstFullDec = 1950, lastFullDec = 2010;
  const dec50 = byDec.get(firstFullDec) ?? 0;
  const dec10 = byDec.get(lastFullDec) ?? 0;

  const recentYears = recs.filter((r) => r.yr >= yMax - 9 && r.yr <= yMax).length;
  const earlyYears = recs.filter((r) => r.yr >= 1950 && r.yr <= 1959).length;

  let i = 0;
  const add = (headline: string, stat: string, detail: string) =>
    out.push({ n: ++i, headline, stat, detail });

  add("Scope of record", `${N(recs.length)}`,
    `tornadoes logged across the U.S. from ${yMin} to ${yMax}.`);
  add("Lives lost", `${N(totFat)}`,
    `total fatalities in the record — and ${N(totInj)} injuries.`);
  add("Deadliest single tornado", `${N(deadliest.fat)} deaths`,
    `${sName(deadliest.st)}, ${fdate(deadliest)} (${deadliest.mag >= 0 ? "EF" + deadliest.mag : "rating unknown"})${deadliest.co[0] ? ` — ${deadliest.co[0]} Co.` : ""}.`);
  add("Busiest year", `${N(busyYearN)}`,
    `tornadoes in ${busyYear} — the most of any year on record.`);
  add("Deadliest year", `${N(deadYearN)} deaths`,
    `concentrated in ${deadYear}, driven largely by spring super-outbreaks.`);
  add("Deadliest single day", `${N(deadDayN)} deaths`,
    `on ${recsByDayLabel(deadDay)} — the worst tornado day since 1950.`);
  add("Most tornadoes in one day", `${N(busyDayN)}`,
    `touched down on ${recsByDayLabel(busyDay)} in a single outbreak.`);
  add("Peak month", `${MONTHS[peakMonth - 1]}`,
    `accounts for ${N(peakMonthN)} tornadoes — the heart of the season.`);
  add("Tornado capital", sName(topState),
    `leads all states with ${N(topStateN)} tornadoes.`);
  add("Most fatalities by state", sName(topStateFatK),
    `has recorded ${N(topStateFatV)} tornado deaths — more than any other.`);
  add("Violent but rare", `${N(violent)}`,
    `EF4+EF5 tornadoes — only ${((violent / recs.length) * 100).toFixed(1)}% of all events.`);
  add("...yet they dominate death tolls", `${((violentFat / totFat) * 100).toFixed(0)}%`,
    `of all tornado deaths come from those few violent tornadoes.`);
  add("EF5 — the rarest", `${N(ef5)}`,
    `EF5/F5 tornadoes in the entire record. ${sName(topEf5State)} has the most (${topEf5StateN}).`);
  ef5List.sort(cmpDate);
  if (ef5List.length >= 2) {
    const last = ef5List[ef5List.length - 1];
    const prev = ef5List[ef5List.length - 2];
    const gap = last.yr - prev.yr;
    add("Longest EF5 gap broken", `${gap} yrs`,
      `between EF5s: ${sName(last.st)} on ${fdate(last)} was the first EF5 anywhere since ${sName(prev.st)}, ${fdate(prev)}.`);
  } else if (ef5List.length === 1) {
    add("Last EF5", fdate(ef5List[0]),
      `the most recent EF5 on record — ${sName(ef5List[0].st)}.`);
  }
  add("Most weak", `${((weak / recs.length) * 100).toFixed(0)}%`,
    `of all tornadoes are EF0–EF1 — the great majority are short and weak.`);
  add("Longest track", `${longest.len.toFixed(0)} mi`,
    `single tornado path — ${sName(longest.st)}, ${fdate(longest)}.`);
  add("Widest tornado", `${N(widest.wid)} yd`,
    `path width (~${(widest.wid / 1760).toFixed(2)} mi) — ${sName(widest.st)}, ${fdate(widest)}.`);
  add("Costliest tornado", humanizeUSD(costliest.loss),
    `in property loss — ${sName(costliest.st)}, ${fdate(costliest)} (un-adjusted).`);
  add("Total property loss", humanizeUSD(totLoss),
    `in reported damage since 1996 (dollar figures only tracked from then).`);
  add("Detection, not weather", `${dec10 ? "+" + Math.round(((dec10 - dec50) / dec50) * 100) + "%" : "—"}`,
    `more tornadoes logged in the 2010s vs the 1950s (${N(dec50)}→${N(dec10)}) — mostly better detection of weak tornadoes, not more storms.`);

  return out.slice(0, 20);
}

function cmpDate(a: Tornado, b: Tornado): number {
  return a.yr - b.yr || a.mo - b.mo || a.dy - b.dy ||
    a.tm.localeCompare(b.tm);
}
