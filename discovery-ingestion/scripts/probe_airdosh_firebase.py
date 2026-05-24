"""Extract Firebase config from AirDosh app.js."""
import httpx
import re
import json

js = httpx.get("https://www.airdosh.co.za/js/app.3f574903.js", timeout=30).text

# firebase config object
for pat in [
    r'apiKey:"([^"]+)"',
    r'projectId:"([^"]+)"',
    r'authDomain:"([^"]+)"',
    r'appId:"([^"]+)"',
]:
    m = re.search(pat, js)
    print(pat, m.group(1) if m else None)

# broader firebase init
idx = js.find("projectId")
print("\ncontext:", js[idx-100:idx+200] if idx >= 0 else "none")

# tickets subdomain
r = httpx.get("https://tickets.airdosh.co.za/", timeout=30, follow_redirects=True)
print("\ntickets", r.status_code, r.url, len(r.text))
print(r.text[:800])

# search tickets site for events list
if len(r.text) < 5000:
    tjs = re.findall(r'src="([^"]+\.js)"', r.text)
    print("ticket scripts", tjs)
