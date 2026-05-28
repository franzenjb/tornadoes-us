# US Tornado Compendium

Interactive web tool to explore every recorded US tornado from **1950–2026** (≈73,610 events).

Built from the [NOAA Storm Prediction Center tornado database](https://www.spc.noaa.gov/wcm/#data) (1950–2025 finalized) plus the [NCEI Storm Events Database](https://www.ncei.noaa.gov/stormevents/) (2026 partial).

## What it does

Filter the full database by:
- **Month** (toggle any combination of Jan–Dec)
- **Year range** (with quick presets: last 5/10/20/30 years, or full record)
- **State** (multi-select)
- **County** (free-text, autocompletes from selected states)
- **EF/F intensity** (EF0–EF5 plus unknown)
- **Minimum injuries**
- **Minimum deaths**

Then explore three ways:
- **Charts** — by year (stacked by EF), by month, top 20 states
- **Map** — Leaflet basemap with color-coded EF markers (priority sample keeps all EF3+ and fatal events)
- **Table** — sortable, paginated, CSV export

## Built-in reports

- May tornadoes · past 20 years
- Violent tornadoes (EF4 + EF5)
- Deadly events (10+ fatalities)
- Spring season · last decade
- Tornado Alley (OK, KS, TX, NE)
- Dixie Alley (AL, MS, LA, TN, AR)
- April outbreaks · all years
- Winter tornadoes (Dec–Feb)

## Stack

- Next.js 16 (App Router)
- React + TypeScript + Tailwind CSS
- Zustand (filter store)
- Chart.js + react-chartjs-2
- Leaflet + react-leaflet
- Data shipped as a single 12 MB JSON (≈2 MB gzipped) generated from SPC CSV

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Rebuilding the dataset

```bash
python3 data-build/fetch.py   # download latest SPC + NCEI source files
python3 data-build/build.py   # rebuild public/data/*.json
```

`fetch.py` auto-discovers the newest SPC base (`1950-YYYY`), SPC current-year
(`YYYY_torn.csv`), and NCEI current-year details file. `build.py` finds sources
by glob, so neither needs editing as years roll over.

## Auto-update

`.github/workflows/update-data.yml` runs every Monday (and on-demand via the
Actions tab). It fetches the latest source files, rebuilds the JSON, and commits
only if the data changed. The repo is connected to Vercel, so each data commit
auto-deploys. Manual trigger: GitHub → Actions → "Update tornado data" → Run
workflow.

## Data caveats

- EF/F scale `-9` = "unknown" — most often pre-2007 records where the rating was lost or never assigned.
- `loss` is property loss in millions USD, **un-adjusted** for inflation. SPC's encoding changed in 1996.
- Pre-2000 county FIPS codes are occasionally missing; only counties resolvable against the 2020 Census FIPS file are shown.
- Path lengths/widths are point-in-time SPC reports — narrow or short tornadoes pre-1995 are likely undercounted.

## Source

NOAA / NWS — Storm Prediction Center — Severe Weather Database files (1950–2026).
