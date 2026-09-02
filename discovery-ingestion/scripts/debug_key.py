"""Find all Algolia keys in Quicket bundle."""
import httpx
import re

with httpx.Client(timeout=30, follow_redirects=True) as client:
    home = client.get("https://www.quicket.co.za/events")
    js = re.search(r"/app-elements/main\.[a-f0-9]+\.js", home.text).group(0)
    text = client.get(f"https://www.quicket.co.za{js}").text

# broader patterns
patterns = [
    r'apiKey["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    r'searchApiKey["\']?\s*[:=]\s*["\']([a-f0-9]{32})["\']',
    r'["\']([a-f0-9]{32})["\']',
]
for pat in patterns:
    keys = dict.fromkeys(re.findall(pat, text, re.I))
    print(pat[:40], len(keys))
    for k in list(keys)[:5]:
        print(" ", k)

# known working key
WORKING = "ec5eb43c5ca4fd2aa3883ae2c131f731"
print("working key in bundle?", WORKING in text)
