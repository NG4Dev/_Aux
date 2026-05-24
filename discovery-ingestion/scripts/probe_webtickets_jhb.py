"""Webtickets JHB search / location."""
import re
from playwright.sync_api import sync_playwright

SEARCH_URLS = [
    "https://www.webtickets.co.za/v2/Search.aspx?q=Johannesburg",
    "https://www.webtickets.co.za/v2/Search.aspx?q=johannesburg",
    "https://www.webtickets.co.za/v2/Event.aspx?city=Johannesburg",
]

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    for url in SEARCH_URLS:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)
            for _ in range(15):
                page.evaluate("window.scrollBy(0, 900)")
                page.wait_for_timeout(500)
            html = page.content()
            ids = set(re.findall(r'event\.aspx\?itemid=(\d+)', html, re.I))
            print(url, "events", len(ids), "title", page.title()[:60])
        except Exception as e:
            print(url, e)
