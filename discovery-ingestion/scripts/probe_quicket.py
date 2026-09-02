"""Probe Quicket for Algolia search key."""
import re
import httpx

r = httpx.get("https://www.quicket.co.za/events/johannesburg", follow_redirects=True, timeout=30)
print("status", r.status_code, "len", len(r.text))

patterns = [
    r'searchApiKey["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    r'apiKey["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    r'X-Algolia-API-Key["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    r'algolia.*?["\']([a-f0-9]{32})["\']',
]
for pat in patterns:
    m = re.findall(pat, r.text, re.I | re.S)
    if m:
        print("pattern match:", pat[:50], m[:3])

# Also try main JS bundles
for src in re.findall(r'src="(/[^"]+\.js)"', r.text)[:10]:
    js = httpx.get(f"https://www.quicket.co.za{src}", timeout=30)
    for pat in patterns:
        m = re.findall(pat, js.text, re.I)
        if m:
            print("JS", src, "key", m[0])
