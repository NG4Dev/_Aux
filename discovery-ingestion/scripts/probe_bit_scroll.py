"""Probe BandsInTown scroll loading."""
from playwright.sync_api import sync_playwright
import json
from bs4 import BeautifulSoup

url = "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres"

def count_events(html):
    soup = BeautifulSoup(html, "lxml")
    n = 0
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "MusicEvent":
                    n += 1
                elif isinstance(item, dict) and item.get("@graph"):
                    n += sum(1 for x in item["@graph"] if isinstance(x, dict) and x.get("@type") == "MusicEvent")
        except Exception:
            pass
    return n

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(4000)
    last = 0
    for i in range(40):
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(1200)
        c = count_events(page.content())
        if c != last:
            print(f"round {i} events {c}")
            last = c
    print("final", last)
