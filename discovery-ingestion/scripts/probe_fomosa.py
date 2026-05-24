"""Probe Fomosa experiences listing."""
import httpx
import re
import json
from bs4 import BeautifulSoup

url = "https://fomosa.co.za/experiences"
r = httpx.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
print("status", r.status_code, len(r.text))
soup = BeautifulSoup(r.text, "lxml")
products = []
for a in soup.find_all("a", href=True):
    href = a["href"]
    if "/product/" in href:
        products.append({"url": href if href.startswith("http") else "https://fomosa.co.za" + href, "title": a.get_text(strip=True)[:80]})
print("products", len(products))
for p in products[:8]:
    print(p)

# JSON-LD Product/Offer
for script in soup.find_all("script", type="application/ld+json"):
    try:
        data = json.loads(script.string or "")
        print("ld type", data.get("@type") if isinstance(data, dict) else type(data))
    except Exception:
        pass
