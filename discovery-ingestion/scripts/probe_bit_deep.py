"""Deep probe BandsInTown page structure."""
from playwright.sync_api import sync_playwright
import json
import re

urls = [
    "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres",
    "https://www.bandsintown.com/?came_from=257&concerts=true&sort_by_filter=Date+of+Announcement",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for url in urls:
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        api_hits = []
        def on_resp(r):
            u = r.url
            if r.status != 200:
                return
            if any(x in u for x in ["graphql", "api", "search", "events", "concerts", "recommendations"]):
                try:
                    txt = r.text()
                    if len(txt) > 100 and any(k in txt for k in ["startDate", "venue", "artist", "eventId", "datetime"]):
                        api_hits.append((u[:150], len(txt), txt[:300]))
                except Exception:
                    pass
        page.on("response", on_resp)
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(8000)
        text = page.inner_text("body")[:2000]
        print("\n===", url[:70])
        print("body preview:", text[:500].replace("\n", " | "))
        stats = page.evaluate("""() => ({
          links: document.querySelectorAll('a').length,
          eLinks: [...document.querySelectorAll('a')].filter(a => (a.href||'').includes('/e/')).length,
          artistLinks: [...document.querySelectorAll('a')].filter(a => (a.href||'').includes('/a/')).length,
          scripts: document.querySelectorAll('script').length,
        })""")
        print("stats", stats)
        for i in range(10):
            page.evaluate("window.scrollBy(0, 800)")
            page.wait_for_timeout(1500)
        stats2 = page.evaluate("""() => ({
          eLinks: [...document.querySelectorAll('a')].filter(a => (a.href||'').includes('/e/')).length,
          artistLinks: [...document.querySelectorAll('a')].filter(a => (a.href||'').includes('/a/')).length,
        })""")
        print("after scroll", stats2)
        html = page.content()
        for pat in [r'window\.__[A-Z_]+', r'"startDate"', r'/e/\d+', r'data-testid']:
            print(pat, len(re.findall(pat, html)))
        print("api hits", len(api_hits))
        for u, ln, prev in api_hits[:5]:
            print(" ", u, ln, prev.replace("\n"," ")[:200])
        page.close()
