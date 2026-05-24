"""Probe Webtickets listing page."""
import httpx
import re
from playwright.sync_api import sync_playwright

print("HTTP", httpx.get("https://www.webtickets.co.za/v2/Event.aspx", timeout=30).status_code)

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/v2/Event.aspx", wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(5000)
    links = page.eval_on_selector_all(
        "a[href*='Event']",
        "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,80)})).slice(0,30)",
    )
    print("links", len(links))
    for l in links[:15]:
        print(l)
    html = page.content()
    print("event.aspx links", len(re.findall(r"Event\.aspx\?[^\"']+", html)))
