"""Explore Quicket Algolia index schema."""
import httpx
import json

APP_ID = "QAUIPDMSEL"
KEY = "ec5eb43c5ca4fd2aa3883ae2c131f731"
URL = f"https://{APP_ID.lower()}-dsn.algolia.net/1/indexes/products/query"
headers = {"X-Algolia-Application-Id": APP_ID, "X-Algolia-API-Key": KEY}

def query(payload):
    r = httpx.post(URL, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()

# No filter - see total hits and sample fields
data = query({"query": "", "hitsPerPage": 3, "page": 0})
print("total nbHits", data.get("nbHits"))
for hit in data.get("hits", []):
    print("---")
    print("name:", hit.get("name"))
    city_keys = [k for k in hit if "city" in k.lower() or "region" in k.lower() or "location" in k.lower()]
    for k in city_keys:
        print(f"  {k}:", hit.get(k))

# Correct filter (capital City)
for filt in ["City:'Johannesburg'", "City:'Cape Town'", "City:'Durban'"]:
    d = query({"query": "", "filters": filt, "hitsPerPage": 2, "page": 0})
    print(f"filter {filt!r} -> nbHits={d.get('nbHits')}, names={[h.get('ProductName') for h in d.get('hits',[])]}")

# Search by text johannesburg
d = query({"query": "johannesburg", "hitsPerPage": 5, "page": 0})
print("text search johannesburg nbHits", d.get("nbHits"))
if d.get("hits"):
    print("first hit keys sample:", list(d["hits"][0].keys())[:20])
