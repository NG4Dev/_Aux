"""BIT homepage concerts scroll with stealth."""
from playwright.sync_api import sync_playwright
import json
from bs4 import BeautifulSoup

url = "https://www.bandsintown.com/?came_from=257&concerts=true&sort_by_filter=Date+of+Announcement"

def count_events(html):
    soup = BeautifulSoup(html, "lxml")
    n = 0
    seen = set()
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "MusicEvent":
                    k = item.get("@id") or item.get("url")
                    if k not in seen:
                        seen.add(k)
                        n += 1
                elif isinstance(item, dict) and item.get("@graph"):
                    for node in item["@graph"]:
                        if isinstance(node, dict) and node.get("@type") == "MusicEvent":
                            k = node.get("@id") or node.get("url")
                            if k not in seen:
                                seen.add(k)
                                n += 1
        except Exception:
            pass
    return n

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    last = 0
    for i in range(50):
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(1200)
        c = count_events(page.content())
        if c != last:
            print(f"round {i} events {c}")
            last = c
    print("final", last)
