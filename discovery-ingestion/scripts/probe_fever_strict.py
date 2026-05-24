"""Debug fever plan link extraction."""
from playwright.sync_api import sync_playwright
from src.scrapers.playwright_helpers import scroll_until_count_stable

url = "https://feverup.com/en/johannesburg/music-events"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(6000)
    scroll_until_count_stable(page, "document.querySelectorAll(\"a[href*='/m/']\").length", max_rounds=20, pause_ms=800)
    strict = page.eval_on_selector_all("a[href*='/m/']", """els => {
      const out = []; const seen = new Set();
      for (const e of els) {
        const href = (e.href || '').split('?')[0];
        const match = href.match(/\\/m\\/(\\d+)/);
        if (!match || seen.has(href)) continue;
        seen.add(href);
        const text = (e.innerText || '').trim();
        if (!text || text.length < 4) continue;
        out.push({href, text: text.slice(0,80), planId: match[1]});
      }
      return out;
    }""")
    loose = page.eval_on_selector_all("a[href*='/m/']", """els => {
      const byId = {};
      for (const e of els) {
        const href = (e.href || '').split('?')[0];
        const match = href.match(/\\/m\\/(\\d+)/);
        if (!match) continue;
        const text = (e.innerText || '').trim();
        const id = match[1];
        if (!byId[id] || (text.length > (byId[id].text||'').length)) {
          byId[id] = {href, text, planId: id};
        }
      }
      return Object.values(byId);
    }""")
    print("strict", len(strict), "loose", len(loose))
    for x in loose[:5]:
        print(x)
