import type { Filters } from "./store";

export type Preset = {
  id: string;
  label: string;
  hint: string;
  build: (meta: { yearMin: number; yearMax: number }) => Partial<Filters>;
};

export const PRESETS: Preset[] = [
  {
    id: "may-20yr",
    label: "May tornadoes · past 20 years",
    hint: "All May events from the most recent 20-year window.",
    build: (m) => ({
      months: [5],
      yearMin: Math.max(m.yearMin, m.yearMax - 19),
      yearMax: m.yearMax,
    }),
  },
  {
    id: "violent-ef4-ef5",
    label: "Violent tornadoes (EF4 + EF5)",
    hint: "Every recorded EF4 or EF5 in the database.",
    build: () => ({ magMin: 4, magMax: 5 }),
  },
  {
    id: "deadly-10",
    label: "Deadly events (10+ fatalities)",
    hint: "Tornadoes that killed 10 or more people.",
    build: () => ({ fatMin: 10 }),
  },
  {
    id: "spring-decade",
    label: "Spring season · last decade",
    hint: "Mar–May, most recent 10 years.",
    build: (m) => ({
      months: [3, 4, 5],
      yearMin: Math.max(m.yearMin, m.yearMax - 9),
      yearMax: m.yearMax,
    }),
  },
  {
    id: "tornado-alley",
    label: "Tornado Alley (OK, KS, TX, NE)",
    hint: "Classic Plains states, full record.",
    build: () => ({ states: ["OK", "KS", "TX", "NE"] }),
  },
  {
    id: "dixie-alley",
    label: "Dixie Alley (AL, MS, LA, TN, AR)",
    hint: "Southeastern outbreak corridor.",
    build: () => ({ states: ["AL", "MS", "LA", "TN", "AR"] }),
  },
  {
    id: "april-outbreaks",
    label: "April outbreaks · all years",
    hint: "Peak outbreak month, full record.",
    build: () => ({ months: [4] }),
  },
  {
    id: "winter-tornadoes",
    label: "Winter tornadoes (Dec–Feb)",
    hint: "Cold-season events — increasingly common.",
    build: () => ({ months: [12, 1, 2] }),
  },
];
