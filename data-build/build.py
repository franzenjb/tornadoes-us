#!/usr/bin/env python3
"""Convert SPC tornado CSV + Census FIPS to compact JSON."""
import csv, json, gzip, os, sys
from pathlib import Path

HERE = Path(__file__).parent
SPC = HERE / "spc-raw.csv"
CTY = HERE / "counties.csv"
OUT_DIR = HERE.parent / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Build FIPS lookup: "01001" -> "Autauga"
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

def cname(stf, fcode):
    if not fcode or fcode == "0":
        return None
    return fips.get(f"{int(stf):02d}{int(fcode):03d}")

records = []
state_county = {}  # st -> set of counties
years, states = set(), set()

with open(SPC) as f:
    rdr = csv.DictReader(f)
    for r in rdr:
        try:
            yr = int(r["yr"]); mo = int(r["mo"]); dy = int(r["dy"])
            mag = int(r["mag"]); inj = int(r["inj"]); fat = int(r["fat"])
            slat = float(r["slat"]); slon = float(r["slon"])
            elat = float(r["elat"]); elon = float(r["elon"])
            ln = float(r["len"]); wd = float(r["wid"])
            loss = float(r["loss"] or 0)
        except (ValueError, KeyError):
            continue
        st = r["st"]; stf = r["stf"]
        counties = []
        for k in ("f1","f2","f3","f4"):
            c = cname(stf, r.get(k,"0"))
            if c and c not in counties:
                counties.append(c)
        rec = {
            "id": int(r["om"]),
            "yr": yr, "mo": mo, "dy": dy,
            "tm": r["time"][:5],
            "st": st,
            "mag": mag,
            "inj": inj,
            "fat": fat,
            "loss": round(loss, 2),
            "slat": round(slat, 4), "slon": round(slon, 4),
            "elat": round(elat, 4), "elon": round(elon, 4),
            "len": round(ln, 2),
            "wid": int(wd),
            "co": counties,
        }
        records.append(rec)
        years.add(yr); states.add(st)
        state_county.setdefault(st, set()).update(counties)

records.sort(key=lambda r: (r["yr"], r["mo"], r["dy"], r["tm"]))

# Write main JSON (compact)
out_main = OUT_DIR / "tornadoes.json"
with open(out_main, "w") as f:
    json.dump(records, f, separators=(",", ":"))
sz = out_main.stat().st_size

# Gzipped variant for static hosting that doesn't auto-compress
with gzip.open(str(out_main) + ".gz", "wb", compresslevel=9) as gz:
    gz.write(json.dumps(records, separators=(",", ":")).encode())
gz_sz = (OUT_DIR / "tornadoes.json.gz").stat().st_size

# Meta
meta = {
    "count": len(records),
    "yearMin": min(years), "yearMax": max(years),
    "states": sorted(states),
    "stateCounties": {s: sorted(cs) for s, cs in state_county.items()},
    "source": "NOAA SPC Tornado Database (1950-2023)",
    "url": "https://www.spc.noaa.gov/wcm/#data",
}
with open(OUT_DIR / "meta.json", "w") as f:
    json.dump(meta, f, separators=(",", ":"))

print(f"records: {len(records):,}")
print(f"years:   {meta['yearMin']}-{meta['yearMax']}")
print(f"states:  {len(states)}")
print(f"json:    {sz/1024/1024:.2f} MB")
print(f"gz:      {gz_sz/1024/1024:.2f} MB")
