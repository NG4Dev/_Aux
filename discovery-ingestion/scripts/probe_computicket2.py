from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    for url in [
        "https://www.computicket.com/event/list?eventTypes=Music",
        "https://www.computicket.com/event/list?eventTypes=Festival",
    ]:
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(6000)
        links = page.eval_on_selector_all(
            "a[href*='/event/']",
            "els => els.map(e => ({href: e.href.split('?')[0], text: (e.innerText||'').trim().slice(0,80)})).filter(x => x.href.match(/\\/event\\/[^/]+\\/[0-9a-f-]{36}/i))",
        )
        uniq = []
        seen = set()
        for l in links:
            if l["href"] in seen:
                continue
            seen.add(l["href"])
            uniq.append(l)
        print(url, len(uniq))
        for l in uniq[:8]:
            print(" ", l)
