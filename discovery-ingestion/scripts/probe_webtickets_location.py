"""Webtickets location setting."""
from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(4000)
    for label in ["Change Location", "My Location", "Johannesburg"]:
        try:
            el = page.get_by_text(label, exact=False).first
            if el.is_visible(timeout=2000):
                el.click()
                page.wait_for_timeout(1500)
                print("clicked", label)
        except Exception as e:
            print("no", label, e)
    # try typing in location search
    for sel in ["input[type='search']", "input[placeholder*='location' i]", "input"]:
        inp = page.query_selector(sel)
        if inp and inp.is_visible():
            try:
                inp.fill("Johannesburg")
                page.wait_for_timeout(1000)
                page.keyboard.press("Enter")
                page.wait_for_timeout(3000)
                print("filled input", sel)
                break
            except Exception:
                pass
    html = page.content()
    ids = set(re.findall(r'event\.aspx\?itemid=(\d+)', html, re.I))
    print("events after location", len(ids))
    print("body snippet", page.inner_text("body")[:300])
