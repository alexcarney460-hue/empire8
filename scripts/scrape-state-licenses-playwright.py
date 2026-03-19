#!/usr/bin/env python3
"""
Scrape licensed cannabis facilities from CA, WA, and OR state databases
using Playwright browser automation with screenshots for verification.

California: https://search.cannabis.ca.gov/
Washington: https://data.lcb.wa.gov/ (Socrata — try direct download first)
Oregon: https://www.oregon.gov/olcc/marijuana/pages/recreational-marijuana-licensee-reports.aspx

Usage:
  python scripts/scrape-state-licenses-playwright.py --state CA
  python scripts/scrape-state-licenses-playwright.py --state WA
  python scripts/scrape-state-licenses-playwright.py --state OR
  python scripts/scrape-state-licenses-playwright.py --all
  python scripts/scrape-state-licenses-playwright.py --all --screenshots-only

Requires:
  pip install playwright
  playwright install chromium
"""

import sys
import os
import json
import csv
import time
import argparse
from pathlib import Path
from datetime import datetime

# Lazy import playwright
def get_playwright():
    from playwright.sync_api import sync_playwright
    return sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "tmp" / "state-scrapes"
SCREENSHOT_DIR = OUTPUT_DIR / "screenshots"

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def screenshot(page, name):
    """Take a screenshot for verification."""
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOT_DIR / f"{name}-{datetime.now().strftime('%H%M%S')}.png"
    page.screenshot(path=str(path), full_page=False)
    log(f"  Screenshot: {path.name}")
    return str(path)


# ---------------------------------------------------------------------------
# California DCC — search.cannabis.ca.gov
# ---------------------------------------------------------------------------

def scrape_california(page):
    log("\n" + "=" * 60)
    log("CALIFORNIA — Department of Cannabis Control")
    log("=" * 60)

    facilities = []
    url = "https://search.cannabis.ca.gov/"

    license_types = [
        "Cultivator",
        "Processor",
        "Distributor",
        "Testing Laboratory",
        "Manufacturer",
        "Nursery",
    ]

    for lic_type in license_types:
        log(f"\n  Searching: {lic_type}")

        try:
            page.goto(url, timeout=30000, wait_until="networkidle")
            time.sleep(2)

            # Fill the search box with license type
            search_input = page.query_selector('input[placeholder*="search" i], input[placeholder*="Search" i]')
            if not search_input:
                log(f"    No search input found")
                screenshot(page, f"ca-nosearch-{lic_type.lower()}")
                continue

            search_input.fill(lic_type)
            time.sleep(0.5)

            # The search icon is inside the input — click it or press Enter
            search_icon = page.query_selector('[class*="search-icon"], [class*="SearchIcon"], button[aria-label*="search" i], .search-button, span:has-text("Search")')
            if search_icon:
                search_icon.click()
                log(f"    Clicked search icon")
            else:
                search_input.press("Enter")
                log(f"    Pressed Enter")

            # Wait for results table to appear (SPA — need to wait for DOM)
            try:
                page.wait_for_selector("table tbody tr, .search-results, [class*='result']", timeout=15000)
                log(f"    Results loaded")
            except Exception:
                log(f"    Waiting longer for results...")
                time.sleep(5)

            time.sleep(2)
            screenshot(page, f"ca-{lic_type.lower().replace(' ', '-')}-results")

            # Check total results
            total_el = page.query_selector(':text("Total Results Found")')
            total_text = total_el.inner_text() if total_el else ""
            log(f"    {total_text}")

            # Click the Export button to download all results
            # Try export via JS click on Submit inside modal
            export_btn = page.query_selector('button:has-text("Export"), a:has-text("Export")')
            if export_btn:
                log(f"    Clicking Export button...")
                export_btn.click()
                time.sleep(1)

                # Select "All Data" radio
                try:
                    page.get_by_text("All Data").click()
                    log(f"    Selected 'All Data'")
                except Exception:
                    pass

                time.sleep(0.5)

                # Use JS click to bypass overlay interception
                submit_btn = page.query_selector('button:has-text("Submit")')
                if submit_btn:
                    try:
                        with page.expect_download(timeout=60000) as download_info:
                            submit_btn.evaluate("el => el.click()")
                            log(f"    JS-clicked Submit — waiting for download...")

                        download = download_info.value
                        download_path = str(OUTPUT_DIR / f"ca-{lic_type.lower().replace(' ', '-')}-export.csv")
                        download.save_as(download_path)
                        log(f"    Downloaded: {download_path}")

                        # Parse the exported CSV
                        import csv as csvmod
                        with open(download_path, "r", encoding="utf-8-sig") as f:
                            reader = csvmod.DictReader(f)
                            count = 0
                            for row in reader:
                                name = ""
                                for key in ["Legal Business Name", "DBA Name", "Business Name"]:
                                    if key in row and row[key] and row[key] != "Data Not Available":
                                        name = row[key]
                                        break
                                facilities.append({
                                    "name": name,
                                    "dba": row.get("DBA Name", ""),
                                    "license_number": row.get("License Number", ""),
                                    "license_type": row.get("License Type", lic_type),
                                    "license_status": (row.get("License Status", "") or "active").lower(),
                                    "address": row.get("Premise Address", ""),
                                    "city": row.get("Premise City", ""),
                                    "state": "CA",
                                    "zip": row.get("Premise Zip", ""),
                                    "county": row.get("County", ""),
                                    "phone": "",
                                    "source": "ca_dcc_export",
                                })
                                count += 1
                            log(f"    Parsed {count} records from export")
                        continue  # skip table scraping
                    except Exception as e:
                        log(f"    Export download failed: {e}")
                        # Close modal
                        close = page.query_selector('button:has-text("Cancel"), [aria-label="Close"]')
                        if close:
                            close.click(force=True)
                            time.sleep(0.5)

            # Fallback: scrape table rows page by page
            log(f"    Scraping table rows (pagination)...")
            page_num = 1
            while True:
                rows = page.query_selector_all("table tbody tr")
                if not rows:
                    break

                for row in rows:
                    cells = row.query_selector_all("td")
                    if len(cells) >= 5:
                        facilities.append({
                            "name": cells[4].inner_text().strip() if len(cells) > 4 else "",
                            "dba": cells[3].inner_text().strip() if len(cells) > 3 else "",
                            "license_number": cells[0].inner_text().strip(),
                            "license_type": cells[1].inner_text().strip(),
                            "license_status": cells[2].inner_text().strip().lower(),
                            "county": cells[5].inner_text().strip() if len(cells) > 5 else "",
                            "state": "CA",
                            "source": "ca_dcc_playwright",
                        })

                log(f"    Page {page_num}: {len(rows)} rows (total: {len(facilities)})")

                # Next page
                next_btn = page.query_selector('[aria-label="Next page"], button:has-text("Next"), a:has-text("Next"), [class*="next"]')
                if next_btn:
                    try:
                        is_disabled = next_btn.get_attribute("disabled") or next_btn.get_attribute("aria-disabled")
                        if is_disabled:
                            break
                        next_btn.click()
                        time.sleep(2)
                        page.wait_for_selector("table tbody tr", timeout=10000)
                        page_num += 1
                        if page_num > 100:
                            break
                    except Exception:
                        break
                else:
                    break

        except Exception as e:
            log(f"    Error scraping {lic_type}: {e}")
            screenshot(page, f"ca-error-{lic_type.lower()}")

    log(f"\n  California total: {len(facilities)}")
    return facilities


# ---------------------------------------------------------------------------
# Washington LCB — data.lcb.wa.gov (Socrata)
# ---------------------------------------------------------------------------

def scrape_washington(page):
    log("\n" + "=" * 60)
    log("WASHINGTON — Liquor and Cannabis Board")
    log("=" * 60)

    facilities = []

    # Try Socrata CSV download first (most reliable)
    csv_url = "https://data.lcb.wa.gov/api/views/u3zh-ri66/rows.csv?accessType=DOWNLOAD"
    log(f"  Trying Socrata CSV download...")

    try:
        page.goto(csv_url, timeout=60000)
        time.sleep(3)
        screenshot(page, "wa-csv-download")

        # Check if we got a CSV (the page body will contain CSV text)
        body = page.inner_text("body")
        if "," in body and len(body) > 1000:
            log(f"    Got CSV response ({len(body)} chars)")
            lines = body.strip().split("\n")
            if len(lines) > 1:
                reader = csv.DictReader(lines)
                cannabis_types = {"MARIJUANA", "CANNABIS", "PRODUCER", "PROCESSOR", "LAB", "TEST", "DISTRIBUT"}

                for row in reader:
                    privilege = (row.get("Privilege", "") or row.get("privilege", "")).upper()
                    if not any(t in privilege for t in cannabis_types):
                        continue

                    facilities.append({
                        "name": row.get("Tradename", "") or row.get("tradename", "") or row.get("Name", ""),
                        "dba": row.get("Tradename", "") or row.get("tradename", ""),
                        "license_number": row.get("License", "") or row.get("license", ""),
                        "license_type": privilege,
                        "license_status": (row.get("Status", "") or "active").lower(),
                        "address": row.get("Address", "") or row.get("address", ""),
                        "city": row.get("City", "") or row.get("city", ""),
                        "state": "WA",
                        "zip": row.get("Zip", "") or row.get("zip", ""),
                        "county": row.get("County", "") or row.get("county", ""),
                        "phone": "",
                        "source": "wa_lcb_socrata_csv",
                    })

                log(f"    Cannabis facilities from CSV: {len(facilities)}")
                return facilities
    except Exception as e:
        log(f"    CSV download failed: {e}")

    # Fallback: browse the data portal
    log(f"  Fallback: browsing data portal...")
    try:
        page.goto("https://data.lcb.wa.gov/Licensing/Licensed-Businesses/u3zh-ri66", timeout=30000, wait_until="networkidle")
        time.sleep(3)
        screenshot(page, "wa-data-portal")

        # Try the JSON API
        json_url = "https://data.lcb.wa.gov/resource/u3zh-ri66.json?$where=privilege%20like%20%27%25MARIJUANA%25%27&$limit=50000"
        page.goto(json_url, timeout=30000)
        time.sleep(2)
        body = page.inner_text("body")
        screenshot(page, "wa-json-api")

        try:
            data = json.loads(body)
            log(f"    JSON API returned {len(data)} records")
            for r in data:
                priv = (r.get("privilege", "") or "").upper()
                if not any(t in priv for t in {"PRODUCER", "PROCESSOR", "LAB", "TEST", "MARIJUANA"}):
                    continue
                facilities.append({
                    "name": r.get("tradename", "") or r.get("name", ""),
                    "dba": r.get("tradename", ""),
                    "license_number": r.get("license", ""),
                    "license_type": priv,
                    "license_status": (r.get("status", "") or "active").lower(),
                    "address": r.get("address", ""),
                    "city": r.get("city", ""),
                    "state": "WA",
                    "zip": r.get("zip", ""),
                    "county": r.get("county", ""),
                    "phone": "",
                    "source": "wa_lcb_socrata_json",
                })
        except json.JSONDecodeError:
            log(f"    JSON parse failed")

    except Exception as e:
        log(f"    Data portal error: {e}")
        screenshot(page, "wa-error")

    log(f"\n  Washington total: {len(facilities)}")
    return facilities


# ---------------------------------------------------------------------------
# Oregon OLCC
# ---------------------------------------------------------------------------

def scrape_oregon(page):
    log("\n" + "=" * 60)
    log("OREGON — Oregon Liquor and Cannabis Commission")
    log("=" * 60)

    facilities = []

    # Try Socrata CSV
    csv_url = "https://data.olcc.state.or.us/api/views/6v5b-pqdi/rows.csv?accessType=DOWNLOAD"
    log(f"  Trying Socrata CSV download...")

    try:
        page.goto(csv_url, timeout=60000)
        time.sleep(3)
        screenshot(page, "or-csv-download")

        body = page.inner_text("body")
        if "," in body and len(body) > 1000:
            log(f"    Got CSV response ({len(body)} chars)")
            lines = body.strip().split("\n")
            if len(lines) > 1:
                reader = csv.DictReader(lines)
                cannabis_types = {"PRODUCER", "PROCESSOR", "WHOLESALE", "LAB", "TEST", "GROW", "CULTIV", "MANUFACTUR"}

                for row in reader:
                    lic_type = ""
                    for key in ["License Type", "license_type", "Category", "category", "Type"]:
                        if key in row and row[key]:
                            lic_type = row[key].upper()
                            break

                    if not any(t in lic_type for t in cannabis_types):
                        continue

                    name = ""
                    for key in ["Business Name", "business_name", "Trade Name", "trade_name", "Name"]:
                        if key in row and row[key]:
                            name = row[key]
                            break

                    facilities.append({
                        "name": name,
                        "dba": row.get("Trade Name", "") or row.get("trade_name", ""),
                        "license_number": row.get("License No", "") or row.get("license_no", "") or row.get("License Number", ""),
                        "license_type": lic_type,
                        "license_status": (row.get("Status", "") or row.get("status", "") or "active").lower(),
                        "address": row.get("Address", "") or row.get("address", "") or row.get("Street Address", ""),
                        "city": row.get("City", "") or row.get("city", ""),
                        "state": "OR",
                        "zip": row.get("Zip", "") or row.get("zip", "") or row.get("Zip Code", ""),
                        "county": row.get("County", "") or row.get("county", ""),
                        "phone": "",
                        "source": "or_olcc_socrata_csv",
                    })

                log(f"    Cannabis facilities from CSV: {len(facilities)}")
                if len(facilities) > 0:
                    return facilities
    except Exception as e:
        log(f"    CSV download failed: {e}")

    # Fallback: JSON API
    log(f"  Fallback: JSON API...")
    try:
        json_url = "https://data.olcc.state.or.us/resource/6v5b-pqdi.json?$limit=50000"
        page.goto(json_url, timeout=30000)
        time.sleep(2)
        body = page.inner_text("body")
        screenshot(page, "or-json-api")

        data = json.loads(body)
        log(f"    JSON API returned {len(data)} records")
        for r in data:
            lic_type = (r.get("license_type", "") or r.get("category", "")).upper()
            if not any(t in lic_type for t in {"PRODUCER", "PROCESSOR", "WHOLESALE", "LAB", "TEST", "GROW"}):
                continue
            facilities.append({
                "name": r.get("business_name", "") or r.get("trade_name", ""),
                "dba": r.get("trade_name", ""),
                "license_number": r.get("license_no", "") or r.get("license_number", ""),
                "license_type": lic_type,
                "license_status": (r.get("status", "") or "active").lower(),
                "address": r.get("address", "") or r.get("street_address", ""),
                "city": r.get("city", ""),
                "state": "OR",
                "zip": r.get("zip", "") or r.get("zip_code", ""),
                "county": r.get("county", ""),
                "phone": "",
                "source": "or_olcc_socrata_json",
            })
    except Exception as e:
        log(f"    JSON API error: {e}")
        screenshot(page, "or-error")

    # Fallback 2: OLCC licensee reports page
    if len(facilities) == 0:
        log(f"  Fallback 2: OLCC licensee reports page...")
        try:
            page.goto("https://www.oregon.gov/olcc/marijuana/pages/recreational-marijuana-licensee-reports.aspx", timeout=30000, wait_until="networkidle")
            time.sleep(3)
            screenshot(page, "or-licensee-reports")

            # Look for download links
            links = page.query_selector_all("a[href*='.xlsx'], a[href*='.csv'], a[href*='.pdf']")
            log(f"    Found {len(links)} download links")
            for link in links:
                href = link.get_attribute("href") or ""
                text = link.inner_text() or ""
                log(f"      {text}: {href}")
        except Exception as e:
            log(f"    Reports page error: {e}")

    log(f"\n  Oregon total: {len(facilities)}")
    return facilities


# ---------------------------------------------------------------------------
# CSV Export
# ---------------------------------------------------------------------------

def save_csv(facilities, state_code):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d")
    path = OUTPUT_DIR / f"{state_code.lower()}-cannabis-licenses-{timestamp}.csv"

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "name", "dba", "license_number", "license_type", "license_status",
            "address", "city", "state", "zip", "county", "phone", "source",
        ])
        writer.writeheader()
        writer.writerows(facilities)

    log(f"  CSV saved: {path} ({len(facilities)} rows)")
    return str(path)


def merge_into_master(state_facilities):
    """Merge state results into the master CSV."""
    master_path = PROJECT_ROOT / "cannabis-hemp-grows-2026-03-17.csv"
    existing = []

    if master_path.exists():
        with open(master_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            existing = list(reader)
        log(f"  Master CSV has {len(existing)} existing rows")

    # Add new facilities, dedup by name+state
    seen = set()
    for row in existing:
        key = f"{(row.get('Name', '') or '').lower()}|{row.get('State', '')}"
        seen.add(key)

    added = 0
    for fac in state_facilities:
        key = f"{fac['name'].lower()}|{fac['state']}"
        if key in seen or not fac["name"]:
            continue
        seen.add(key)
        existing.append({
            "Name": fac["name"],
            "DBA": fac.get("dba", ""),
            "License Number": fac.get("license_number", ""),
            "License Type": fac.get("license_type", ""),
            "Status": fac.get("license_status", ""),
            "Address": fac.get("address", ""),
            "City": fac.get("city", ""),
            "State": fac.get("state", ""),
            "Zip": fac.get("zip", ""),
            "County": fac.get("county", ""),
            "Phone": fac.get("phone", ""),
            "Website": "",
            "Source": fac.get("source", ""),
        })
        added += 1

    with open(master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "Name", "DBA", "License Number", "License Type", "Status",
            "Address", "City", "State", "Zip", "County", "Phone", "Website", "Source",
        ])
        writer.writeheader()
        writer.writerows(existing)

    log(f"  Master CSV updated: {added} new, {len(existing)} total")
    return added


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Playwright scraper for CA/WA/OR cannabis licenses")
    parser.add_argument("--state", type=str, help="Scrape a single state (CA, WA, OR)")
    parser.add_argument("--all", action="store_true", help="Scrape all three states")
    parser.add_argument("--screenshots-only", action="store_true", help="Just take screenshots, no scraping")
    args = parser.parse_args()

    if not args.state and not args.all:
        parser.print_help()
        return

    states = []
    if args.all:
        states = ["CA", "WA", "OR"]
    elif args.state:
        states = [args.state.upper()]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    sync_playwright = get_playwright()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        all_facilities = []

        for state in states:
            if state == "CA":
                results = scrape_california(page)
            elif state == "WA":
                results = scrape_washington(page)
            elif state == "OR":
                results = scrape_oregon(page)
            else:
                log(f"Unknown state: {state}")
                continue

            if results:
                save_csv(results, state)
                all_facilities.extend(results)

        browser.close()

    # Merge into master CSV
    if all_facilities:
        log(f"\n{'=' * 60}")
        log(f"MERGING INTO MASTER CSV")
        log(f"{'=' * 60}")
        merge_into_master(all_facilities)

    # Final report
    log(f"\n{'=' * 60}")
    log(f"FINAL REPORT")
    log(f"{'=' * 60}")
    log(f"  Total scraped: {len(all_facilities)}")
    for state in states:
        count = sum(1 for f in all_facilities if f["state"] == state)
        log(f"    {state}: {count}")
    log(f"  Screenshots: {SCREENSHOT_DIR}")
    log(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
