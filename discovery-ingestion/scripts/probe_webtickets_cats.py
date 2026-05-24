"""Webtickets category tabs + carousel."""
import re
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(5000)
    all_ids = set()

    def collect():
        html = page.content()
        all_ids.update(re.findall(r'event\.aspx\?itemid=(\d+)', html, re.I))

    collect()
    # category chips
    cats = page.eval_on_selector_all(
        "a, button, [role='tab'], .category, [class*='Category'], [class*='filter']",
        """els => els.map(e => (e.innerText||'').trim()).filter(t => t.length > 2 && t.length < 40).slice(0,30)""",
    )
    print("sample labels", list(dict.fromkeys(cats))[:25])
    # try clicking Music / Featured tabs by text
    for label in ["Music", "Featured", "Running", "Multisport", "JHB", "Gauteng"]:
        btn = page.get_by_text(label, exact=False).first
        try:
            if btn and btn.is_visible():
                btn.click(timeout=3000)
                page.wait_for_timeout(2500)
                collect()
                print(f"after click {label!r} total ids {len(all_ids)}")
        except Exception:
            pass
    # carousel next buttons
    for _ in range(10):
        arrows = page.query_selector_all("[class*='arrow'], [class*='next'], button[aria-label*='next' i]")
        clicked = False
        for a in arrows[:3]:
            try:
                if a.is_visible():
                    a.click()
                    page.wait_for_timeout(1500)
                    collect()
                    clicked = True
            except Exception:
                pass
        if not clicked:
            break
    for _ in range(20):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(400)
        collect()
    print("final unique ids", len(all_ids))
