"""Search Howler HTML/JS for event data patterns."""
import httpx
import re
from playwright.sync_api import sync_playwright

# Static fetch
r = httpx.get("https://howler.co.za/events", follow_redirects=True, timeout=30)
text = r.text
print("static len", len(text))
for pat in [
    r"howler\.co\.za/events/[a-z0-9-]+",
    r"/api/[^\"']+",
    r"events\.json",
    r"graphql",
    r"EventListing",
    r"upcomingEvents",
]:
    matches = re.findall(pat, text, re.I)
    if matches:
        print(pat, "->", list(dict.fromkeys(matches))[:8])

# Playwright with cookie accept
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://howler.co.za/events", wait_until="networkidle", timeout=90000)

    # Try accept cookies
    for sel in [
        "button:has-text('Accept')",
        "button:has-text('Accept All')",
        ".cky-btn-accept",
        "#cookieyes-EU-accept-all",
    ]:
        btn = page.query_selector(sel)
        if btn:
            print("clicking", sel)
            btn.click()
            page.wait_for_timeout(2000)
            break

    page.wait_for_timeout(5000)
    html = page.content()

    urls = re.findall(r"https://howler\.co\.za/events/[a-zA-Z0-9_-]+", html)
    print("event urls in html", len(urls), urls[:10])

    # all text blocks that look like events
    cards = page.query_selector_all("[class*='event' i], article, [data-testid]")
    print("candidate cards", len(cards))
    for c in cards[:15]:
        cls = c.get_attribute("class") or ""
        tid = c.get_attribute("data-testid") or ""
        txt = (c.inner_text() or "").strip().replace("\n", " ")[:100]
        if txt:
            print(" card", cls[:40], tid, "|", txt)

    # screenshot for debug
    inner = page.inner_text("body")[:2000]
    print("\nbody text sample:\n", inner[:1500])

    # network - all howler domains
    browser.close()
