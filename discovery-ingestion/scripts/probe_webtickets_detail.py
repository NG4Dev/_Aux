"""Parse webtickets detail fields."""
import re
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

url = "https://www.webtickets.co.za/v2/event.aspx?itemid=1593370369"

with sync_playwright() as p:
    page = p.chromium.launch(headless=True).new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)
    soup = BeautifulSoup(page.content(), "lxml")
    print("title", soup.title.string if soup.title else None)
    for prop in ["og:title", "og:description", "og:image"]:
        m = soup.find("meta", property=prop)
        print(prop, m.get("content")[:120] if m and m.get("content") else None)
    # venue/date patterns in text
    text = soup.get_text("\n", strip=True)
    for line in text.split("\n"):
        ll = line.lower()
        if any(k in ll for k in ["venue", "date", "when", "where", "location", "may", "jun", "arena", "theatre"]):
            if 5 < len(line) < 120:
                print("line:", line)
