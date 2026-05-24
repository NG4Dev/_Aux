from playwright.sync_api import sync_playwright
from pathlib import Path
import re

OUT = Path(__file__).parent / "howler_active.html"

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.howler.co.za/active", wait_until="networkidle", timeout=120000)
    btn = page.query_selector(".cky-btn-accept")
    if btn:
        btn.click()
        page.wait_for_timeout(2000)
    page.wait_for_timeout(10000)
    html = page.content()
    OUT.write_text(html, encoding="utf-8")
    slugs = re.findall(r"/events/([a-zA-Z0-9_-]{4,})", html)
    print("html", len(html), "unique slugs", len(set(slugs)))
    for s in list(dict.fromkeys(slugs))[:25]:
        print(" ", s)
