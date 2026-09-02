"""Probe Fever plan card links with scroll."""
from playwright.sync_api import sync_playwright
import re

url = "https://feverup.com/en/johannesburg/music-events"

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(5000)
    for i in range(15):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(800)
    # all links
    links = page.eval_on_selector_all(
        "a[href]",
        """els => {
          const out = [];
          const seen = new Set();
          for (const e of els) {
            const href = (e.href || '').split('?')[0];
            if (!href.includes('feverup.com/en/johannesburg/') || seen.has(href)) continue;
            seen.add(href);
            const parts = new URL(href).pathname.split('/').filter(Boolean);
            out.push({ href, depth: parts.length, parts: parts.join('/'), text: (e.innerText||'').trim().slice(0,80) });
          }
          return out.sort((a,b) => a.depth - b.depth);
        }""",
    )
    by_depth = {}
    for l in links:
        by_depth.setdefault(l["depth"], []).append(l)
    for d in sorted(by_depth):
        print(f"\ndepth {d}: {len(by_depth[d])}")
        for l in by_depth[d][:20]:
            print(" ", l["parts"], "|", l["text"][:60])
    # cards / data attributes
    cards = page.eval_on_selector_all(
        "[data-testid], article, [class*='PlanCard'], [class*='plan'], a[href*='/m/']",
        "els => els.slice(0,5).map(e => ({tag: e.tagName, testid: e.getAttribute('data-testid'), cls: (e.className||'').slice(0,80), href: e.href||''}))",
    )
    print("\nsample elements", cards[:10])
    html = page.content()
    print("html len", len(html))
    for pat in [r'"planId":(\d+)', r'/m/\d+', r'plan_id', r'experienceId']:
        m = re.findall(pat, html)
        print(pat, "count", len(m), "sample", m[:5])
    # __NEXT_DATA__
    nd = page.query_selector("#__NEXT_DATA__")
    print("next_data el", bool(nd))
