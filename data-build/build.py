#!/usr/bin/env python3
"""Build compact tornado JSON from three sources.

Sources, in priority (later wins for overlapping years):
  1. SPC 1950-2025 finalized       -> data-build/spc-1950-2025.csv
  2. SPC 2025 standalone (full yr) -> data-build/spc-2025.csv         (overrides #1's partial 2025)
  3. NCEI Storm Events 2026         -> data-build/ncei-2026.csv.gz    (fills 2026 partial)
"""
import csv, glob, gzip, json, re
from pathlib import Path

HERE = Path(__file__).parent
CTY = HERE / "counties.csv"
OUT_DIR = HERE.parent / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def _newest(pattern, exclude=None):
    """Newest file (by name, so highest year/compile-date) matching a glob."""
    hits = sorted(glob.glob(str(HERE / pattern)))
    if exclude:
        hits = [h for h in hits if Path(h).name not in exclude]
    return Path(hits[-1]) if hits else None

# Year-agnostic source discovery so the weekly auto-update never needs code edits:
#   base     = the multi-decade SPC file, e.g. spc-1950-2025.csv  (or fetch.py's spc-base.csv)
#   current  = SPC single-year file, e.g. spc-2025.csv / spc-current.csv
#   ncei     = latest NCEI current-year details, e.g. ncei-2026.csv.gz / ncei-current.csv.gz
SPC_BASE = (HERE / "spc-base.csv") if (HERE / "spc-base.csv").exists() else _newest("spc-1950-*.csv")
SPC_CURR = (HERE / "spc-current.csv") if (HERE / "spc-current.csv").exists() else _newest("spc-[12][0-9][0-9][0-9].csv")
NCEI_CURR = (HERE / "ncei-current.csv.gz") if (HERE / "ncei-current.csv.gz").exists() else _newest("ncei-*.csv.gz")

if not SPC_BASE:
    raise SystemExit("No SPC base file found (expected spc-base.csv or spc-1950-*.csv)")

# ---------- FIPS lookup ----------
fips = {}
with open(CTY) as f:
    rdr = csv.DictReader(f, delimiter="|")
    for r in rdr:
        key = r["STATEFP"] + r["COUNTYFP"]
        name = r["COUNTYNAME"]
        for suf in (" County", " Parish", " Borough", " Census Area",
                    " Municipality", " City and Borough", " city"):
            if name.endswith(suf):
                name = name[: -len(suf)]
        fips[key] = name

STATE_ABBR = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
    "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
    "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
    "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
    "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
    "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
    "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
    "55":"WI","56":"WY","60":"AS","66":"GU","69":"MP","72":"PR","78":"VI",
}

def county_for(stf, fcode):
    if not fcode or fcode == "0":
        return None
    try:
        key = f"{int(stf):02d}{int(fcode):03d}"
    except ValueError:
        return None
    return fips.get(key)

# ---------- SPC reader ----------
def parse_spc(path):
    out = []
    with open(path) as f:
        for r in csv.DictReader(f):
            try:
                yr = int(r["yr"]); mo = int(r["mo"]); dy = int(r["dy"])
                mag = int(r["mag"]); inj = int(r["inj"]); fat = int(r["fat"])
                slat = float(r["slat"]); slon = float(r["slon"])
                elat = float(r["elat"]); elon = float(r["elon"])
                ln = float(r["len"]); wd = float(r["wid"])
                loss_raw = float(r["loss"] or 0)
            except (ValueError, KeyError):
                continue
            # SPC loss units differ by era:
            #   1950-1995: a 0-9 CATEGORY code, NOT dollars -> drop (untrustworthy as $)
            #   1996+:     actual whole dollars (this is what the modern file ships)
            loss = int(round(loss_raw)) if yr >= 1996 else 0
            st = r["st"]; stf = r["stf"]
            counties = []
            for k in ("f1","f2","f3","f4"):
                c = county_for(stf, r.get(k, "0"))
                if c and c not in counties:
                    counties.append(c)
            out.append({
                "yr": yr, "mo": mo, "dy": dy,
                "tm": (r["time"] or "00:00:00")[:5],
                "st": st,
                "mag": mag, "inj": inj, "fat": fat,
                "loss": loss,
                "slat": round(slat, 4), "slon": round(slon, 4),
                "elat": round(elat, 4), "elon": round(elon, 4),
                "len": round(ln, 2), "wid": int(wd),
                "co": counties,
            })
    return out

# ---------- NCEI reader ----------
def parse_damage(s):
    """NCEI DAMAGE_PROPERTY like '10.00K' / '1.50M' -> actual whole dollars."""
    if not s: return 0
    s = s.strip().upper().replace(",", "")
    m = re.match(r"^([0-9.]+)\s*([KMBkmb]?)$", s)
    if not m: return 0
    val = float(m.group(1)); unit = m.group(2)
    if unit == "K": val *= 1_000
    elif unit == "M": val *= 1_000_000
    elif unit == "B": val *= 1_000_000_000
    return int(round(val))

def parse_ef(s):
    if not s: return -9
    s = s.strip().upper()
    if s in ("EFU", "F?", ""): return -9
    m = re.match(r"^EF([0-5])$", s)
    if m: return int(m.group(1))
    m = re.match(r"^F([0-5])$", s)
    if m: return int(m.group(1))
    return -9

def parse_ncei(path):
    groups = {}
    with gzip.open(path, "rt") as f:
        rdr = csv.DictReader(f)
        for r in rdr:
            if r.get("EVENT_TYPE", "").strip() != "Tornado":
                continue
            ev = r.get("EVENT_ID", "")
            groups.setdefault(ev, []).append(r)
    out = []
    for ev, rows in groups.items():
        rows.sort(key=lambda r: (r.get("BEGIN_YEARMONTH",""),
                                 r.get("BEGIN_DAY",""),
                                 r.get("BEGIN_TIME","")))
        first, last = rows[0], rows[-1]
        try:
            ym = first["BEGIN_YEARMONTH"]
            yr = int(ym[:4]); mo = int(ym[4:6])
            dy = int(first["BEGIN_DAY"])
        except (ValueError, KeyError):
            continue
        bt = (first.get("BEGIN_TIME","") or "0000").zfill(4)
        tm = f"{bt[:2]}:{bt[2:4]}"
        stf = str(first.get("STATE_FIPS","")).zfill(2)
        st = STATE_ABBR.get(stf, "")
        if not st:
            continue
        inj = sum(int(rr.get("INJURIES_DIRECT") or 0) for rr in rows)
        fat = sum(int(rr.get("DEATHS_DIRECT") or 0) for rr in rows)
        loss = sum(parse_damage(rr.get("DAMAGE_PROPERTY","")) for rr in rows)
        mag = parse_ef(first.get("TOR_F_SCALE",""))
        try:
            length = float(first.get("TOR_LENGTH") or 0)
            width = int(float(first.get("TOR_WIDTH") or 0))
        except ValueError:
            length, width = 0.0, 0
        def f(x):
            try: return float(x)
            except (TypeError, ValueError): return 0.0
        slat = f(first.get("BEGIN_LAT"))
        slon = f(first.get("BEGIN_LON"))
        elat = f(last.get("END_LAT") or first.get("END_LAT"))
        elon = f(last.get("END_LON") or first.get("END_LON"))
        counties = []
        for rr in rows:
            if rr.get("CZ_TYPE","").strip() != "C":
                continue
            cz = str(rr.get("CZ_FIPS","")).strip().zfill(3)
            rstf = str(rr.get("STATE_FIPS","")).zfill(2)
            key = rstf + cz
            nm = fips.get(key) or (rr.get("CZ_NAME","") or "").title().strip()
            if nm and nm not in counties:
                counties.append(nm)
        out.append({
            "yr": yr, "mo": mo, "dy": dy,
            "tm": tm,
            "st": st,
            "mag": mag, "inj": inj, "fat": fat,
            "loss": int(round(loss)),
            "slat": round(slat, 4), "slon": round(slon, 4),
            "elat": round(elat, 4), "elon": round(elon, 4),
            "len": round(length, 2), "wid": width,
            "co": counties,
        })
    return out

# ---------- Merge ----------
base = parse_spc(SPC_BASE)
print(f"SPC base ({SPC_BASE.name}):  {len(base):,}")

spc_curr = parse_spc(SPC_CURR) if SPC_CURR else []
curr_year = max((r["yr"] for r in spc_curr), default=None)
print(f"SPC current ({SPC_CURR.name if SPC_CURR else '-'}): {len(spc_curr):,}"
      + (f" [year {curr_year}]" if curr_year else ""))

ncei_curr = parse_ncei(NCEI_CURR) if NCEI_CURR else []
ncei_year = max((r["yr"] for r in ncei_curr), default=None)
print(f"NCEI current ({NCEI_CURR.name if NCEI_CURR else '-'}): {len(ncei_curr):,}"
      + (f" [year {ncei_year}]" if ncei_year else ""))

# Drop the years we have better single-year sources for, then append them.
override_years = set()
if curr_year:
    override_years.add(curr_year)
if ncei_year:
    override_years.add(ncei_year)
base_filtered = [r for r in base if r["yr"] not in override_years]
records = base_filtered + spc_curr + ncei_curr

records.sort(key=lambda r: (r["yr"], r["mo"], r["dy"], r["tm"], r["st"]))
for i, r in enumerate(records, 1):
    r["id"] = i

out_main = OUT_DIR / "tornadoes.json"
with open(out_main, "w") as f:
    json.dump(records, f, separators=(",", ":"))
sz = out_main.stat().st_size

years = sorted({r["yr"] for r in records})
states = sorted({r["st"] for r in records})
state_county = {}
for r in records:
    state_county.setdefault(r["st"], set()).update(r["co"])

meta = {
    "count": len(records),
    "yearMin": years[0], "yearMax": years[-1],
    "states": states,
    "stateCounties": {s: sorted(cs) for s, cs in state_county.items()},
    "source": f"NOAA SPC (1950-{years[-1]}) + NCEI Storm Events",
    "url": "https://www.spc.noaa.gov/wcm/#data",
    "buildSources": {
        "spc_base": SPC_BASE.name,
        "spc_current": SPC_CURR.name if SPC_CURR else None,
        "ncei_current": NCEI_CURR.name if NCEI_CURR else None,
    },
    "buildDate": __import__("datetime").date.today().isoformat(),
}
with open(OUT_DIR / "meta.json", "w") as f:
    json.dump(meta, f, separators=(",", ":"))

print("---")
print(f"total:   {len(records):,}")
print(f"years:   {years[0]}-{years[-1]}")
print(f"states:  {len(states)}")
print(f"json:    {sz/1024/1024:.2f} MB")
yr_counts = {}
for r in records:
    yr_counts[r["yr"]] = yr_counts.get(r["yr"], 0) + 1
for y in (2022, 2023, 2024, 2025, 2026):
    if y in yr_counts:
        print(f"  {y}: {yr_counts[y]:,}")
