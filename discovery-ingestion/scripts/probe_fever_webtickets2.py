"""Probe Fever __NEXT_DATA__ and Webtickets consumer site."""
import json
import re
import httpx
from playwright.sync_api import sync_playwright

# Fever SSR/Next data
r = httpx.get(
    "https://feverup.com/en/johannesburg/music-events",
    headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en"},
    timeout=30,
)
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(\{.*?\})</script>', r.text, re.S)
print("fever html", len(r.text), "next_data", bool(m))
if m:
    nd = json.loads(m.group(1))
    pp = nd.get("props", {}).get("pageProps", {})
    print("pageProps keys", list(pp.keys())[:15])
    blob = json.dumps(pp)[:5000]
    if "Candlelight" in blob:
        print("has Candlelight in pageProps")
    # find plan ids
    ids = re.findall(r'"planId":(\d+)', blob)
    print("planIds sample", ids[:10], "count", len(ids))

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    for url in [
        "https://www.webtickets.co.za/",
        "https://webtickets.co.za/",
    ]:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(6000)
            print("\nwebtickets", url, "title", page.title())
            for _ in range(8):
                page.evaluate("window.scrollBy(0, 700)")
                page.wait_for_timeout(400)
            links = page.eval_on_selector_all(
                "a[href*='Event.aspx'], a[href*='event.aspx'], a[href*='item.aspx']",
                "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,100)})).filter(x => x.text.length > 5)",
            )
            print(" event links", len(links))
            for l in links[:12]:
                print(" ", l)
        except Exception as e:
            print(url, e)
