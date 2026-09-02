"""Probe Computicket event listing."""
from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://computicket.com/event", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    links = page.eval_on_selector_all(
        "a[href*='event']",
        "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,100)})).filter(x => x.text.length > 3)",
    )
    print("links", len(links))
    for l in links[:20]:
        print(l)
    html = page.content()
    print("event slugs", len(re.findall(r'/event/[a-zA-Z0-9/-]+', html)))
