"""Webtickets extract all itemids + detail parse."""
import re
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto("https://www.webtickets.co.za/", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(5000)
    for _ in range(25):
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(600)
    html = page.content()
    ids = sorted(set(re.findall(r'event\.aspx\?itemid=(\d+)', html, re.I)), key=int, reverse=True)
    print("itemids from html", len(ids), ids[:10])
    # card structure
    cards = page.eval_on_selector_all(
        "a[href*='event.aspx?itemid']",
        """els => {
          const seen = new Set();
          const out = [];
          for (const e of els) {
            const m = e.href.match(/itemid=(\\d+)/i);
            if (!m || seen.has(m[1])) continue;
            seen.add(m[1]);
            const card = e.closest('[class*="card"], [class*="event"], article, li, div');
            const text = card ? (card.innerText||'').trim().slice(0,200) : (e.innerText||'').trim();
            out.push({id: m[1], href: e.href, text});
          }
          return out;
        }""",
    )
    print("cards", len(cards))
    for c in cards[:6]:
        print(" ", c)
    if cards:
        page.goto(cards[0]["href"], wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(3000)
        soup = BeautifulSoup(page.content(), "lxml")
        print("title tag", soup.title.string if soup.title else None)
        og = soup.find("meta", property="og:title")
        print("og:title", og.get("content") if og else None)
        print("h1", soup.find("h1").get_text(strip=True) if soup.find("h1") else None)
