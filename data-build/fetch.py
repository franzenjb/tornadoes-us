#!/usr/bin/env python3
"""Download the latest tornado source files for build.py.

Writes generic, year-agnostic filenames that build.py prefers:
  counties.csv         (Census 2020 FIPS, only if missing)
  spc-base.csv         (newest available 1950-YYYY SPC finalized file)
  spc-current.csv      (newest available single-year SPC file, YYYY_torn.csv)
  ncei-current.csv.gz  (newest NCEI Storm Events details file for the current year)

Pure stdlib so it runs in CI with no pip install.
"""
import datetime, re, ssl, sys, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
UA = {"User-Agent": "tornadoes-us-databuild/1.0 (+github.com/franzenjb/tornadoes-us)"}
YEAR = datetime.date.today().year


def _ctx():
    """SSL context: verified via certifi if available, else system, else
    unverified as a last resort (public, read-only data files)."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        try:
            return ssl.create_default_context()
        except Exception:
            return ssl._create_unverified_context()


CTX = _ctx()


def _open(url, method="GET", timeout=120):
    req = urllib.request.Request(url, method=method, headers=UA)
    try:
        return urllib.request.urlopen(req, timeout=timeout, context=CTX)
    except ssl.SSLCertVerificationError:
        # Local machines sometimes lack a CA bundle; CI does not hit this.
        return urllib.request.urlopen(
            req, timeout=timeout, context=ssl._create_unverified_context())


def head_ok(url):
    try:
        with _open(url, method="HEAD", timeout=30) as r:
            return r.status == 200
    except Exception:
        return False


def download(url, dest):
    with _open(url) as r, open(dest, "wb") as f:
        f.write(r.read())
    print(f"  saved {dest.name}  <- {url}")


def get_text(url):
    with _open(url, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def fetch_counties():
    dest = HERE / "counties.csv"
    if dest.exists():
        print("counties.csv present, skip")
        return
    url = "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt"
    print("counties.csv ...")
    download(url, dest)


def fetch_spc_base():
    print("SPC base ...")
    for y in range(YEAR, YEAR - 4, -1):
        url = f"https://www.spc.noaa.gov/wcm/data/1950-{y}_actual_tornadoes.csv"
        if head_ok(url):
            download(url, HERE / "spc-base.csv")
            return
    sys.exit("ERROR: no SPC base file found for recent years")


def fetch_spc_current():
    print("SPC current-year ...")
    for y in range(YEAR, YEAR - 3, -1):
        url = f"https://www.spc.noaa.gov/wcm/data/{y}_torn.csv"
        if head_ok(url):
            download(url, HERE / "spc-current.csv")
            return
    print("  WARN: no SPC single-year file found (non-fatal)")


def fetch_ncei_current():
    print("NCEI current-year ...")
    listing = get_text(
        "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
    )
    for y in range(YEAR, YEAR - 3, -1):
        pat = re.compile(
            rf"StormEvents_details-ftp_v1\.0_d{y}_c(\d+)\.csv\.gz"
        )
        files = set(pat.findall(listing))
        if not files:
            # also capture full filenames
            full = sorted(set(re.findall(
                rf"StormEvents_details-ftp_v1\.0_d{y}_c\d+\.csv\.gz", listing)))
            if not full:
                continue
            newest = full[-1]
        else:
            comp = max(files)
            newest = f"StormEvents_details-ftp_v1.0_d{y}_c{comp}.csv.gz"
        url = ("https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
               + newest)
        download(url, HERE / "ncei-current.csv.gz")
        return
    print("  WARN: no NCEI current-year file found (non-fatal)")


if __name__ == "__main__":
    fetch_counties()
    fetch_spc_base()
    fetch_spc_current()
    fetch_ncei_current()
    print("fetch complete")
