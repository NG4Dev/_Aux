"""Probe Webtickets homepage."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/v2/Event.aspx", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(5000)
    # scroll
    for _ in range(10):
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(500)
    links = page.eval_on_selector_all(
        "a[href]",
        """
        els => {
          const out = [];
          const seen = new Set();
          for (const e of els) {
            let href = (e.href || '').split('?')[0];
            if (!href.includes('webtickets') || seen.has(href)) continue;
            if (!/Event\\.aspx|event/i.test(href) && !e.closest('[class*=event]')) continue;
            const text = (e.innerText || '').trim().replace(/\\s+/g, ' ');
            if (text.length < 10) continue;
            seen.add(href);
            out.push({href, text: text.slice(0, 120)});
          }
          return out;
        }
        """,
    )
    print("links", len(links))
    for l in links[:20]:
        print(l)
    cards = page.eval_on_selector_all(
        "[class*='event'], .featured-event, article",
        "els => els.length",
    )
    print("card-like elements", cards)
