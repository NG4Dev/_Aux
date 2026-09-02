"""Find Howler backend API from JS bundles and homepage."""
import httpx
import re
import json
from playwright.sync_api import sync_playwright

r = httpx.get("https://howler.co.za/", timeout=30)
scripts = re.findall(r'src="(/[^"]+\.js)"', r.text)
print("scripts", scripts[:15])

for src in scripts[:8]:
    js = httpx.get(f"https://howler.co.za{src}", timeout=30).text
    for pat in [
        r"https://[^\"']+howler[^\"']+",
        r"/api/v[0-9]/[^\"']+",
        r"events[^\"']*endpoint[^\"']*[\"']([^\"']+)[\"']",
        r"organiser[^\"']*events",
    ]:
        m = re.findall(pat, js, re.I)
        if m:
            uniq = list(dict.fromkeys(m))[:5]
            print(src, pat[:30], uniq)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    captured = []

    def on_resp(resp):
        u = resp.url
        if "howler.co.za" in u and resp.status == 200:
            ct = resp.headers.get("content-type", "")
            if "json" in ct or "javascript" in ct:
                captured.append(u)

    page.on("response", on_resp)
    page.goto("https://howler.co.za/", wait_until="networkidle", timeout=90000)
    for sel in ["button:has-text('Accept')", ".cky-btn-accept"]:
        b = page.query_selector(sel)
        if b:
            b.click()
            page.wait_for_timeout(1500)
            break
    page.wait_for_timeout(5000)

    links = page.eval_on_selector_all(
        "a[href*='/events/']",
        "els => els.map(e => e.href)",
    )
    print("\nhomepage event links", len(links), links[:15])

    html = page.content()
    urls = re.findall(r"https://howler\.co\.za/events/[a-zA-Z0-9_-]+", html)
    print("urls in html", urls[:15])

    print("\nhowler responses sample:")
    for u in captured:
        if any(x in u for x in ("event", "api", "search", "listing")):
            print(" ", u)

    browser.close()
