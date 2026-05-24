"""Probe Fever Johannesburg page."""
import httpx
import re
import json
from bs4 import BeautifulSoup

url = "https://feverup.com/en/johannesburg"
r = httpx.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en"})
print("status", r.status_code, "len", len(r.text))
soup = BeautifulSoup(r.text, "lxml")
events = []
for script in soup.find_all("script", type="application/ld+json"):
    try:
        data = json.loads(script.string or "")
        items = data if isinstance(data, list) else [data]
        for item in items:
            t = item.get("@type")
            if t in ("Event", "MusicEvent", "SportsEvent") or (isinstance(t, list) and "Event" in t):
                events.append(item)
    except Exception:
        pass
print("json-ld events", len(events))
for e in events[:3]:
    print(" ", e.get("name"), e.get("startDate"))

links = [a.get("href") for a in soup.find_all("a", href=True) if "/johannesburg/" in a.get("href", "")]
uniq = list(dict.fromkeys(links))
print("city links", len(uniq), uniq[:15])

# __NEXT_DATA__
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(\{.*?\})</script>', r.text, re.S)
if m:
    nd = json.loads(m.group(1))
    print("NEXT keys", nd.keys())
    props = nd.get("props", {}).get("pageProps", {})
    print("pageProps keys", list(props.keys())[:20])
