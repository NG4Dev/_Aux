"""Quick probe of event listing pages."""
import httpx
from bs4 import BeautifulSoup

urls = [
    "https://howler.co.za/events",
    "https://www.computicket.com/events/",
    "https://www.webtickets.co.za/v2/Event.aspx",
]
for url in urls:
    try:
        r = httpx.get(url, follow_redirects=True, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        print(url, r.status_code, len(r.text))
        soup = BeautifulSoup(r.text, "lxml")
        links = [a.get("href") for a in soup.find_all("a", href=True) if "event" in a.get("href", "").lower()]
        print("  event links sample:", links[:5])
    except Exception as e:
        print(url, "ERR", e)
