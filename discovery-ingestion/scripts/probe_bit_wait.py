"""Probe BandsInTown with longer wait and selectors."""
from playwright.sync_api import sync_playwright

url = "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres"

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(8000)
    for i in range(30):
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(1500)
        stats = page.evaluate("""() => ({
          eLinks: document.querySelectorAll('a[href*="/e/"]').length,
          eventCards: document.querySelectorAll('[data-testid="event-card"], .event-card, [class*="EventCard"]').length,
          ldjson: document.querySelectorAll('script[type="application/ld+json"]').length,
          bodyLen: document.body.innerText.length,
        })""")
        if i % 5 == 0 or i < 3:
            print(f"round {i}", stats)
    html = page.content()
    print("MusicEvent count", html.count("MusicEvent"))
    print("startDate count", html.count("startDate"))
    # sample links
    links = page.eval_on_selector_all(
        "a[href]",
        """els => {
          const out = [];
          for (const e of els) {
            const h = e.href || '';
            if (h.includes('/e/') || h.includes('/event/')) {
              out.push({href: h, text: (e.innerText||'').trim().slice(0,60)});
            }
          }
          return out.slice(0, 15);
        }""",
    )
    print("event href samples", links)
