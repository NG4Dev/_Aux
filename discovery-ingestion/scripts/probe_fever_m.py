"""Extract Fever /m/ plan URLs."""
import re
import httpx
from playwright.sync_api import sync_playwright

url = "https://feverup.com/en/johannesburg/music-events"

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(5000)
    for _ in range(15):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(600)
    html = page.content()
    mids = sorted(set(re.findall(r'/m/(\d+)', html)))
    print("unique /m/ ids", len(mids), mids[:20])
    # anchor links with /m/
    links = page.eval_on_selector_all(
        "a[href*='/m/']",
        "els => els.map(e => ({href: e.href, text: (e.innerText||'').trim().slice(0,100)}))",
    )
    print("a /m/ links", len(links))
    for l in links[:15]:
        print(" ", l)
    # also check longer paths
    links2 = page.eval_on_selector_all(
        "a[href*='feverup.com/en/johannesburg/']",
        """els => {
          const out = [];
          const seen = new Set();
          for (const e of els) {
            const href = (e.href||'').split('?')[0];
            if (seen.has(href)) continue;
            seen.add(href);
            const parts = new URL(href).pathname.split('/').filter(Boolean);
            if (parts.length >= 4) out.push({href, parts: parts.join('/'), text: (e.innerText||'').trim().slice(0,80)});
          }
          return out;
        }""",
    )
    print("depth>=4 links", len(links2))
    for l in links2[:15]:
        print(" ", l)

# resolve /m/ URL
if mids:
    mid = mids[0]
    for path in [
        f"https://feverup.com/m/{mid}",
        f"https://feverup.com/en/johannesburg/m/{mid}",
    ]:
        r = httpx.get(path, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        print("\n", path, "->", r.url, r.status_code, (r.text[:200] if r.text else ""))
