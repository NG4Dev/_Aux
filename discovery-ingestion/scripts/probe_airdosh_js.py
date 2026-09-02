"""Probe AirDosh JS bundles for API."""
import httpx
import re
import json

base = "https://www.airdosh.co.za/"
for path in ["js/app.3f574903.js", "js/vendor.86956bbf.js"]:
    js = httpx.get(base + path, timeout=30).text
    print("\n===", path, "len", len(js))
    for pat in [
        r"https://[a-zA-Z0-9._/-]+airdosh[a-zA-Z0-9._/-]*",
        r"/api/[a-zA-Z0-9_/-]+",
        r"events[a-zA-Z0-9_/-]*",
        r"firebase[a-zA-Z0-9._/-]+",
        r"algolia",
    ]:
        m = list(dict.fromkeys(re.findall(pat, js, re.I)))[:12]
        if m:
            print(pat[:35], m)

# try common API bases
for url in [
    "https://www.airdosh.co.za/api/events",
    "https://api.airdosh.co.za/events",
    "https://www.airdosh.co.za/api/v1/events",
    "https://creator.airdosh.co.za/api/events",
]:
    try:
        r = httpx.get(url, timeout=15, follow_redirects=True)
        print(url, r.status_code, r.text[:120])
    except Exception as e:
        print(url, e)
