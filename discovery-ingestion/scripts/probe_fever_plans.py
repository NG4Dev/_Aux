"""Probe Fever music-events plan URL patterns."""
from playwright.sync_api import sync_playwright

url = "https://feverup.com/en/johannesburg/music-events"
with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    for _ in range(15):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(800)
    links = page.eval_on_selector_all(
        "a[href*='/en/johannesburg/']",
        """
        els => {
          const out = [];
          const seen = new Set();
          for (const e of els) {
            const href = (e.href || '').split('?')[0];
            if (!href.includes('feverup.com/en/johannesburg/') || seen.has(href)) continue;
            seen.add(href);
            const parts = new URL(href).pathname.split('/').filter(Boolean);
            const text = (e.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 100);
            if (text.length < 8) continue;
            out.push({href, parts: parts.length, slug: parts.join('/'), text});
          }
          return out;
        }
        """,
    )
    # group by path depth
    from collections import Counter
    depths = Counter(l["parts"] for l in links)
    print("depths", depths)
    for l in links:
        if l["parts"] >= 4 or "candlelight" in l["href"].lower():
            print(l)
