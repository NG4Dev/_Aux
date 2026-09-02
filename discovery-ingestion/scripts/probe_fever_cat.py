"""Probe Fever category pages for events."""
import httpx
import re
import json

url = "https://feverup.com/en/johannesburg/music-events"
r = httpx.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en"})
print("status", len(r.text))
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(\{.*?\})</script>', r.text, re.S)
if m:
    nd = json.loads(m.group(1))
    pp = nd.get("props", {}).get("pageProps", {})
    print("pageProps keys", list(pp.keys())[:20])
    # dig for plans/events
    blob = json.dumps(pp)[:3000]
    print(blob)

links = re.findall(r'href="(/en/[^"]+)"', r.text)
eventish = [l for l in links if "johannesburg" in l and l.count("/") >= 4]
print("deep links", len(set(eventish)), list(dict.fromkeys(eventish))[:12])
