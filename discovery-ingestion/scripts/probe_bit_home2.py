"""BIT home stealth body check."""
from playwright.sync_api import sync_playwright
import json
from bs4 import BeautifulSoup

url = "https://www.bandsintown.com/?came_from=257&utm_medium=web&utm_source=home&utm_campaign=just_announced&sort_by_filter=Date+of+Announcement&concerts=true"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(10000)
    print("body", page.inner_text("body")[:400].replace("\n"," | "))
    html = page.content()
    print("cloudflare", "security verification" in html.lower())
    print("ldjson scripts", html.count("application/ld+json"))
    print("e-links", page.evaluate("document.querySelectorAll('a[href*=\"/e/\"]').length"))
