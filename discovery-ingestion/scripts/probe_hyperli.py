"""Probe Hyperli deals listing."""
import httpx
import re
import json
from bs4 import BeautifulSoup

for path in ["/deals/johannesburg", "/collections/johannesburg-deals", "/collections/all"]:
    url = "https://hyperli.com" + path
    r = httpx.get(url, timeout=30, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    print(url, r.status_code, len(r.text))
    soup = BeautifulSoup(r.text, "lxml")
    deals = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/products/" in href or "/deals/" in href:
            t = a.get_text(strip=True)
            if t and len(t) > 5:
                deals.append((href, t[:60]))
    print("  deals", len(deals), deals[:5])
