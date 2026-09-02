"""Probe BandsInTown alternatives."""
import httpx
import re
import json
from bs4 import BeautifulSoup

cities = [
    "https://www.bandsintown.com/c/johannesburg-south-africa/all-dates/genre/all-genres",
    "https://www.bandsintown.com/c/johannesburg-gauteng-south-africa/all-dates/genre/all-genres",
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

for url in cities:
    r = httpx.get(url, headers=headers, follow_redirects=True, timeout=30)
    print(url, r.status_code, len(r.text))
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "lxml")
        events = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict) and item.get("@type") == "MusicEvent":
                        events.append(item.get("name"))
            except Exception:
                pass
        print(" MusicEvents", len(events), events[:3])
