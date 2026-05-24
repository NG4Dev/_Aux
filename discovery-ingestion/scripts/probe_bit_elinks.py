"""Extract BIT events from /e/ links."""
from playwright.sync_api import sync_playwright
import re

urls = [
    "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres",
    "https://www.bandsintown.com/?came_from=257&concerts=true&sort_by_filter=Date+of+Announcement",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
    for url in urls:
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(8000)
        last = 0
        for i in range(45):
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            page.wait_for_timeout(1200)
            links = page.eval_on_selector_all(
                "a[href*='/e/']",
                """els => {
                  const seen = new Set();
                  const out = [];
                  for (const e of els) {
                    const href = e.href.split('?')[0];
                    if (seen.has(href)) continue;
                    seen.add(href);
                    const card = e.closest('div');
                    out.push({href, text: (card?.innerText||e.innerText||'').trim().slice(0,120)});
                  }
                  return out;
                }""",
            )
            if len(links) != last:
                print(url[:55], "round", i, "unique /e/", len(links))
                last = len(links)
        print("final", last, "sample", links[:3] if links else [])
        page.close()
