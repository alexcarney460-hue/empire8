#!/usr/bin/env python3
"""
Scrape California DCC licenses by intercepting the API the search page calls.

Opens the CA DCC search page, captures the XHR API endpoint it uses,
then calls that API directly with large page sizes to get all records.

Usage:
  python scripts/scrape-ca-dcc-api.py
"""

import sys
import json
import csv
import time
from pathlib import Path
from datetime import datetime

import httpx
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "tmp" / "state-scrapes"
SCREENSHOT_DIR = OUTPUT_DIR / "screenshots"

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    captured_apis = []

    def handle_route(route):
        """Capture API calls the page makes."""
        url = route.request.url
        if "filteredSearch" in url or "licenses" in url.lower():
            captured_apis.append(url)
            log(f"  Captured API: {url[:120]}")
        route.continue_()

    log("=" * 60)
    log("CA DCC — API Intercept Scraper")
    log("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        page = browser.new_context(
            viewport={"width": 1440, "height": 900},
        ).new_page()

        # Intercept all XHR/fetch requests
        page.route("**/*", handle_route)

        log("\n  Loading CA DCC search page...")
        page.goto("https://search.cannabis.ca.gov/", timeout=30000, wait_until="networkidle")
        time.sleep(2)

        # Do a search to trigger the API
        log("  Searching 'Cultivator' to capture API pattern...")
        search = page.query_selector('input[placeholder*="search" i], input[placeholder*="Search" i]')
        if search:
            search.fill("Cultivator")
            time.sleep(0.5)
            icon = page.query_selector('[class*="search-icon"], [class*="SearchIcon"], span:has-text("Search")')
            if icon:
                icon.click()
            else:
                search.press("Enter")
            time.sleep(5)
            page.wait_for_selector("table tbody tr", timeout=15000)

        page.screenshot(path=str(SCREENSHOT_DIR / "ca-api-intercept.png"))
        log(f"\n  Captured {len(captured_apis)} API URLs")
        for url in captured_apis:
            log(f"    {url[:150]}")

        browser.close()

    # Now call the API directly with httpx (no browser needed)
    if not captured_apis:
        log("\n  No API captured. Trying known endpoint directly...")
        # The CA DCC site uses an Azure backend API
        captured_apis = ["https://as-cdt-pub-vip-cannabis-ww-p-002.azurewebsites.net/licenses/filteredSearch"]

    # Find the filteredSearch API URL specifically
    base_api = None
    for url in captured_apis:
        if "filteredSearch" in url:
            base_api = url.split("?")[0]
            break

    if not base_api:
        # Derive from any captured URL by replacing the path
        for url in captured_apis:
            if "azurewebsites.net" in url:
                parts = url.split("/licenses")
                if parts:
                    base_api = parts[0] + "/licenses/filteredSearch"
                    break

    if not base_api:
        base_api = "https://as-dcc-pub-cann-w-p-002.azurewebsites.net/licenses/filteredSearch"
        log(f"  Using hardcoded API endpoint")

    log(f"\n  Using API: {base_api}")

    license_types = ["Cultivator", "Processor", "Distributor", "Testing Laboratory", "Manufacturer", "Nursery"]
    all_facilities = []

    for lic_type in license_types:
        log(f"\n  Fetching: {lic_type}")
        page_num = 1
        page_size = 500
        total_for_type = 0

        while True:
            try:
                url = f"{base_api}?pageNumber={page_num}&pageSize={page_size}&searchQuery={lic_type}"
                resp = httpx.get(url, timeout=30, follow_redirects=True)
                if resp.status_code != 200:
                    log(f"    HTTP {resp.status_code}: {resp.text[:200]}")
                    break

                data = resp.json()
                items = []
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    for key in ["data", "Data", "results", "Results", "items", "Items", "licenses", "Licenses"]:
                        if key in data and isinstance(data[key], list):
                            items = data[key]
                            break
                    if not items and page_num == 1:
                        log(f"    Response keys: {list(data.keys())[:10]}")
                        log(f"    Sample: {json.dumps(data, indent=2)[:500]}")

                if not items:
                    break

                for r in items:
                    all_facilities.append({
                        "name": r.get("businessLegalName", "") or r.get("businessDbaName", ""),
                        "dba": r.get("businessDbaName", ""),
                        "license_number": r.get("licenseNumber", ""),
                        "license_type": r.get("licenseType", lic_type),
                        "license_status": (r.get("licenseStatus", "") or "active").lower(),
                        "address": r.get("premiseStreetAddress", ""),
                        "city": r.get("premiseCity", ""),
                        "state": "CA",
                        "zip": r.get("premiseZipCode", ""),
                        "county": r.get("premiseCounty", ""),
                        "phone": r.get("businessPhone", ""),
                        "email": r.get("businessEmail", ""),
                        "owner": r.get("businessOwnerName", ""),
                        "source": "ca_dcc_api",
                    })
                    total_for_type += 1

                log(f"    Page {page_num}: {len(items)} records (running total: {total_for_type})")

                if len(items) < page_size:
                    break
                page_num += 1
                time.sleep(0.3)

            except Exception as e:
                log(f"    Error: {e}")
                break

        log(f"    {lic_type} total: {total_for_type}")

    # Save CSV
    if all_facilities:
        csv_path = OUTPUT_DIR / f"ca-dcc-full-{datetime.now().strftime('%Y-%m-%d')}.csv"
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(all_facilities[0].keys()))
            writer.writeheader()
            writer.writerows(all_facilities)
        log(f"\n  CSV saved: {csv_path} ({len(all_facilities)} rows)")

        # Merge into master
        master = PROJECT_ROOT / "cannabis-hemp-grows-2026-03-17.csv"
        if master.exists():
            existing = []
            with open(master, "r", encoding="utf-8") as f:
                existing = list(csv.DictReader(f))
            seen = {f"{r.get('Name','').lower()}|{r.get('State','')}" for r in existing}
            added = 0
            for fac in all_facilities:
                key = f"{fac['name'].lower()}|CA"
                if key in seen or not fac["name"]:
                    continue
                seen.add(key)
                existing.append({
                    "Name": fac["name"], "DBA": fac.get("dba", ""),
                    "License Number": fac.get("license_number", ""),
                    "License Type": fac.get("license_type", ""),
                    "Status": fac.get("license_status", ""),
                    "Address": fac.get("address", ""), "City": fac.get("city", ""),
                    "State": "CA", "Zip": fac.get("zip", ""),
                    "County": fac.get("county", ""), "Phone": "",
                    "Website": "", "Source": "ca_dcc_api",
                })
                added += 1
            with open(master, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(existing[0].keys()))
                writer.writeheader()
                writer.writerows(existing)
            log(f"  Master CSV: +{added} new CA records ({len(existing)} total)")

    log(f"\n{'=' * 60}")
    log(f"FINAL: {len(all_facilities)} CA facilities scraped")
    log(f"{'=' * 60}\n")

if __name__ == "__main__":
    main()
