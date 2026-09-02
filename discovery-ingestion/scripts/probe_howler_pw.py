"""Playwright probe for Howler - dump structure."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://howler.co.za/events", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    html = page.content()
    print("html len", len(html))
    # all links
    links = page.eval_on_selector_all("a[href]", "els => els.map(e => ({href: e.href, text: e.innerText.trim().slice(0,60)}))")
    event_links = [l for l in links if "event" in l["href"].lower()]
    print("total links", len(links), "event-ish", len(event_links))
    for l in event_links[:15]:
        print(l)
    browser.close()
