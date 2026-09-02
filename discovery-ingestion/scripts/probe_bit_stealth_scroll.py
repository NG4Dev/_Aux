"""BIT stealth scroll count."""
from playwright.sync_api import sync_playwright
import json
from bs4 import BeautifulSoup

url = "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres"

def parse_ld(html):
    soup = BeautifulSoup(html, "lxml")
    events = []
    seen = set()
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "MusicEvent":
                    key = item.get("@id") or item.get("url") or item.get("name")
                    if key not in seen:
                        seen.add(key)
                        events.append(item)
                elif isinstance(item, dict) and item.get("@graph"):
                    for node in item["@graph"]:
                        if isinstance(node, dict) and node.get("@type") == "MusicEvent":
                            key = node.get("@id") or node.get("url") or node.get("name")
                            if key not in seen:
                                seen.add(key)
                                events.append(node)
        except Exception:
            pass
    return events

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled"],
    )
    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ),
        locale="en-US",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
    )
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    last = 0
    for i in range(40):
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(1200)
        ev = len(parse_ld(page.content()))
        elinks = page.evaluate("document.querySelectorAll('a[href*=\"/e/\"]').length")
        if ev != last or i % 8 == 0:
            print(f"round {i} ldjson={ev} e-links={elinks}")
            last = ev
    print("final ldjson", len(parse_ld(page.content())))
