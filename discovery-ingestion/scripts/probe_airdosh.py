"""Probe AirDosh for API / embedded data."""
import httpx
import re
import json
from playwright.sync_api import sync_playwright

print("=== HTTP ===")
r = httpx.get("https://www.airdosh.co.za/events", follow_redirects=True, timeout=30)
print("status", r.status_code, "len", len(r.text))
for pat in [r"algolia", r"apiKey", r"/api/", r"__NEXT", r"application/ld\+json", r"events/"]:
    m = re.findall(pat, r.text, re.I)
    if m:
        print(pat, len(m))

scripts = re.findall(r'src="([^"]+\.js)"', r.text)
print("scripts", scripts[:10])

print("\n=== Playwright ===")
api_hits = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    def on_resp(resp):
        if resp.status == 200 and "airdosh" in resp.url:
            ct = resp.headers.get("content-type", "")
            if "json" in ct:
                try:
                    api_hits.append((resp.url, resp.json()))
                except Exception:
                    pass

    page.on("response", on_resp)
    page.goto("https://www.airdosh.co.za/events", wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(5000)
    html = page.content()
    links = page.eval_on_selector_all(
        "a[href*='/events/']",
        "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,80)}))",
    )
    print("event links", len(links))
    for l in links[:12]:
        print(" ", l)
    slugs = re.findall(r"/events/([a-zA-Z0-9_-]+)", html)
    print("slugs unique", len(set(slugs)), list(dict.fromkeys(slugs))[:10])
    browser.close()

print("\n=== JSON API ===")
for url, body in api_hits[:10]:
    print(url[:120])
    if isinstance(body, dict):
        print(" keys", list(body.keys())[:12])
