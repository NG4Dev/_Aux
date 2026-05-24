"""Probe BandsInTown event DOM and API."""
from playwright.sync_api import sync_playwright
import json
import re

urls = [
    "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres",
    "https://www.bandsintown.com/?concerts=true&sort_by_filter=Date+of+Announcement",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for url in urls:
        page = browser.new_page()
        events_seen = []
        def on_response(resp):
            if "bandsintown" in resp.url and resp.status == 200:
                ct = resp.headers.get("content-type", "")
                if "json" in ct or "graphql" in resp.url or "api" in resp.url:
                    try:
                        body = resp.text()
                        if "MusicEvent" in body or "startDate" in body or "eventId" in body:
                            events_seen.append((resp.url[:120], len(body)))
                    except Exception:
                        pass
        page.on("response", on_response)
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(4000)
        last = 0
        for i in range(25):
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            page.wait_for_timeout(1000)
            c = page.evaluate("""() => {
              return document.querySelectorAll('a[href*="/e/"]').length;
            }""")
            if c != last:
                print(url[:60], "round", i, "e-links", c)
                last = c
        print("final e-links", last, "json responses", len(events_seen))
        for u, ln in events_seen[:5]:
            print(" ", u, ln)
        html = page.content()
        print("MusicEvent in html", html.count("MusicEvent"))
        print("application/ld+json", html.count("application/ld+json"))
        page.close()
