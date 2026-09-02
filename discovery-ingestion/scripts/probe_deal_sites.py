"""Probe Fomosa, Hyperli, Fever, Computicket."""
import httpx
import re
from playwright.sync_api import sync_playwright

SITES = [
    ("fomosa", "https://www.fomosa.co.za/experiences"),
    ("hyperli", "https://www.hyperli.com/deals/johannesburg"),
    ("fever", "https://feverup.com/en/johannesburg"),
    ("computicket", "https://www.computicket.com/events/"),
]

for name, url in SITES:
    try:
        r = httpx.get(url, follow_redirects=True, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        print(f"\n{name} HTTP {r.status_code} len={len(r.text)} final={r.url}")
        for pat in [r"algolia", r"apiKey", r"application/ld\+json", r"/api/"]:
            if re.search(pat, r.text, re.I):
                print("  has", pat)
        links = re.findall(r'href="([^"]*(?:event|deal|experience)[^"]*)"', r.text, re.I)
        print("  links sample", links[:5])
    except Exception as e:
        print(name, "ERR", e)

print("\n=== Playwright quick ===")
with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    for name, url in SITES:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)
            links = page.eval_on_selector_all(
                "a[href]",
                "els => els.map(e => e.href).filter(h => /event|deal|experience|ticket/i.test(h)).slice(0,8)",
            )
            print(name, "pw links", len(links), links[:5])
        except Exception as e:
            print(name, "pw ERR", str(e)[:80])
