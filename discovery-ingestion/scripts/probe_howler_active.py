"""Probe Howler active page - save HTML and find patterns."""
import re
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).parent / "howler_active.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    api_data = []

    def on_resp(resp):
        url = resp.url
        if resp.status == 200 and ("howler" in url or "search" in url.lower()):
            ct = resp.headers.get("content-type", "")
            if "json" in ct:
                try:
                    api_data.append((url, resp.json()))
                except Exception:
                    pass

    page.on("response", on_resp)
    page.goto("https://www.howler.co.za/active", wait_until="networkidle", timeout=120000)
    for sel in ["button:has-text('Accept')", ".cky-btn-accept"]:
        b = page.query_selector(sel)
        if b:
            b.click()
            page.wait_for_timeout(1500)
            break

    # Try search input
    search = page.query_selector("input[type='search'], input[placeholder*='Search' i], input[name='search']")
    if search:
        search.fill("Johannesburg")
        page.wait_for_timeout(3000)
        search.press("Enter")
        page.wait_for_timeout(5000)

    html = page.content()
    OUT.write_text(html, encoding="utf-8")
    print("saved html", len(html))

    urls = re.findall(r"https://www\.howler\.co\.za/events/[a-zA-Z0-9_-]+", html)
    print("event urls", len(urls), urls[:10])

    # slug paths
    slugs = re.findall(r"/events/([a-zA-Z0-9_-]{3,})", html)
    print("slug paths", len(slugs), list(dict.fromkeys(slugs))[:10])

    for url, body in api_data:
        print("API", url[:100])
        Path(__file__).parent.joinpath("howler_api_sample.json").write_text(
            json.dumps(body, indent=2)[:8000], encoding="utf-8"
        )

    browser.close()
