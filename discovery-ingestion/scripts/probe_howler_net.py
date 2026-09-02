"""Capture ALL howler.co.za network responses."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    hits = []

    def on_resp(resp):
        if "howler" in resp.url and resp.status == 200:
            hits.append((resp.url, resp.headers.get("content-type", "")))

    page.on("response", on_resp)
    page.goto("https://howler.co.za/events", wait_until="networkidle", timeout=120000)
    for sel in ["button:has-text('Accept')", ".cky-btn-accept"]:
        b = page.query_selector(sel)
        if b:
            b.click()
            page.wait_for_timeout(2000)
            break
    page.wait_for_timeout(8000)

    for url, ct in hits:
        print(url[:150], "|", ct[:40])

    # Try clicking Events nav or filters
    for sel in ["text=Johannesburg", "text=Gauteng", "text=Cape Town", "[class*='city']"]:
        el = page.query_selector(sel)
        if el:
            print("found filter", sel)

    browser.close()
