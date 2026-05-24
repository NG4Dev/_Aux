"""Try BandsInTown with stealth-ish browser args."""
from playwright.sync_api import sync_playwright

url = "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--disable-blink-features=AutomationControlled",
        ],
    )
    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ),
        locale="en-US",
        viewport={"width": 1366, "height": 768},
    )
    context.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
    )
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(12000)
    body = page.inner_text("body")[:500]
    print("body", body.replace("\n", " | "))
    print("e-links", page.evaluate("document.querySelectorAll('a[href*=\"/e/\"]').length"))
    browser.close()
