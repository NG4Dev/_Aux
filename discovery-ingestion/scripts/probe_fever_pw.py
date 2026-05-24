"""Probe Fever plan links via Playwright."""
from playwright.sync_api import sync_playwright

CITY_PATHS = {
    "johannesburg": "https://feverup.com/en/johannesburg/music-events",
    "cape-town": "https://feverup.com/en/cape-town/music-events",
}

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    for city, url in CITY_PATHS.items():
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(6000)
        links = page.eval_on_selector_all(
            "a[href]",
            """
            els => {
              const city = %r;
              const out = [];
              const seen = new Set();
              for (const e of els) {
                let href = e.href || '';
                if (!href.includes('feverup.com/en/') || !href.includes(city)) continue;
                const parts = href.split('/').filter(Boolean);
                if (parts.length < 5) continue;
                if (href.includes('music-events') || href.includes('things-to-do')) continue;
                if (seen.has(href)) continue;
                seen.add(href);
                out.push({href, text: (e.innerText||'').trim().slice(0,80)});
              }
              return out.slice(0, 30);
            }
            """ % city.replace("-", "-"),
        )
        print(city, len(links))
        for l in links[:8]:
            print(" ", l)
