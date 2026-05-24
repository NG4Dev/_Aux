"""Probe tickets.airdosh.co.za consumer site."""
import httpx
import re
import json
from bs4 import BeautifulSoup

for url in [
    "https://tickets.airdosh.co.za/",
    "https://tickets.airdosh.co.za/events",
    "https://tickets.airdosh.co.za/event",
]:
    r = httpx.get(url, timeout=30, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    print(url, "->", r.status_code, r.url, len(r.text))
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(\{.*?\})</script>', r.text, re.S)
    if m:
        nd = json.loads(m.group(1))
        pp = nd.get("props", {}).get("pageProps", {})
        print("  pageProps keys", list(pp.keys())[:15])
        print("  sample", json.dumps(pp, default=str)[:600])

links = re.findall(r'href="(/event/[^"]+)"', r.text)
print("event paths", len(set(links)), list(dict.fromkeys(links))[:10])

# RSC / api
for pat in [r'"/api/[^"]+"', r'events[^"]{0,30}']:
    pass

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://tickets.airdosh.co.za/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    links = page.eval_on_selector_all(
        "a[href*='/event']",
        "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,80)}))",
    )
    print("\nPW event links", len(links))
    for l in links[:15]:
        print(l)
