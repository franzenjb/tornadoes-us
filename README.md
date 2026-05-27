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
cd data-build
curl -sSL -o spc-raw.csv "https://www.spc.noaa.gov/wcm/data/<latest>_actual_tornadoes.csv"
python3 build.py
```

Writes `public/data/tornadoes.json`, `tornadoes.json.gz`, and `meta.json`.

## Data caveats

- EF/F scale `-9` = "unknown" — most often pre-2007 records where the rating was lost or never assigned.
- `loss` is property loss in millions USD, **un-adjusted** for inflation. SPC's encoding changed in 1996.
- Pre-2000 county FIPS codes are occasionally missing; only counties resolvable against the 2020 Census FIPS file are shown.
- Path lengths/widths are point-in-time SPC reports — narrow or short tornadoes pre-1995 are likely undercounted.

## Source

NOAA / NWS — Storm Prediction Center — Severe Weather Database files (1950–2026).
