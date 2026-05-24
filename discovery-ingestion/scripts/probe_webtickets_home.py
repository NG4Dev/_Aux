"""Webtickets homepage scroll + categories."""
import re
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(5000)
    last = 0
    for i in range(30):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(800)
        c = page.evaluate("""() => {
          const links = [...document.querySelectorAll('a[href*="event.aspx?itemid"]')];
          return new Set(links.map(l => l.href.toLowerCase())).size;
        }""")
        if c != last:
            print(f"scroll {i} unique events {c}")
            last = c
    # click category tabs if any
    tabs = page.query_selector_all("a, button, [role='tab']")
    print("clickable tabs", len(tabs))
    events = page.eval_on_selector_all(
        "a[href*='event.aspx?itemid']",
        """els => {
          const seen = new Set();
          const out = [];
          for (const e of els) {
            const href = e.href.split('#')[0];
            if (seen.has(href)) continue;
            seen.add(href);
            const text = (e.innerText||'').trim();
            if (text.length < 5) continue;
            out.push({href, text: text.split('\\n').slice(0,3).join(' | ')});
          }
          return out;
        }""",
    )
    print("final events", len(events))
    for e in events[:8]:
        print(" ", e)
    # detail page
    if events:
        page.goto(events[0]["href"], wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(3000)
        html = page.content()
        print("detail title", page.title())
        print("og:title", "og:title" in html)
        print("ld+json", html.count("application/ld+json"))
