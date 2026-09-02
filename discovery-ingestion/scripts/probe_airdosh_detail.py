"""Parse AirDosh event detail HTML."""
import httpx
import re
import json
from bs4 import BeautifulSoup

url = "https://tickets.airdosh.co.za/event/mind-hive/o3lJgkVbunBS1LN"
r = httpx.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "lxml")
for script in soup.find_all("script"):
    t = script.string or script.get_text() or ""
    if "event" in t.lower() and len(t) < 50000 and ("startDate" in t or "venue" in t.lower() or "pageProps" in t):
        print("--- script len", len(t))
        print(t[:1500])
        print()

for script in soup.find_all("script", type="application/ld+json"):
    print("LD", script.string[:500])

print("title", soup.title.string if soup.title else None)
og = soup.find("meta", property="og:title")
print("og", og.get("content") if og else None)
