from playwright.sync_api import sync_playwright

url = "https://feverup.com/en/johannesburg/music-events"
with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    links = page.eval_on_selector_all(
        "a[href*='/en/johannesburg/']",
        "els => els.map(e => ({href: e.href.split('?')[0], text: (e.innerText||'').trim().slice(0,60)})).filter(x => x.text.length > 2)",
    )
    print("all jhb links", len(links))
    for l in links[:25]:
        parts = l["href"].split("/")
        if len(parts) >= 5:
            print(l)
