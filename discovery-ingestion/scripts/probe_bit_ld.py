"""BIT scroll with domcontentloaded."""
from playwright.sync_api import sync_playwright
import json
from bs4 import BeautifulSoup

url = "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres"

def parse_ld(html):
    soup = BeautifulSoup(html, "lxml")
    events = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "MusicEvent":
                    events.append(item)
                elif isinstance(item, dict) and item.get("@graph"):
                    events.extend(x for x in item["@graph"] if isinstance(x, dict) and x.get("@type") == "MusicEvent")
        except Exception:
            pass
    return events

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(6000)
    last = 0
    for i in range(35):
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(1200)
        ev = parse_ld(page.content())
        elinks = page.evaluate("document.querySelectorAll('a[href*=\"/e/\"]').length")
        if len(ev) != last or i % 7 == 0:
            print(f"round {i} ldjson={len(ev)} e-links={elinks}")
            last = len(ev)
    print("final ldjson", len(parse_ld(page.content())))
    # __NEXT_DATA__ or embedded state
    html = page.content()
    if "__NEXT_DATA__" in html:
        print("has next data")
    if "window.__" in html[:50000]:
        print("has window globals")
