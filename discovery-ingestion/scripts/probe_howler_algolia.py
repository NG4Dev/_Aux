import httpx
import json

APP_ID = "K4FPULVWDS"
API_KEY = "cdec92c6ac1ad99de33520350ef41eee"
URL = f"https://{APP_ID.lower()}-dsn.algolia.net/1/indexes/Event/query"
headers = {"X-Algolia-Application-Id": APP_ID, "X-Algolia-API-Key": API_KEY}

def q(payload):
    r = httpx.post(URL, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()

# sample hit full keys
d = q({"query": "", "hitsPerPage": 1, "page": 0})
hit = d["hits"][0]
print("sample hit:")
print(json.dumps(hit, indent=2)[:2000])

# city filters
for filt in [
    "venue.city:'Johannesburg'",
    "venue.city:Johannesburg",
    "tags:'Johannesburg'",
    "tags:Johannesburg",
]:
    try:
        dd = q({"query": "", "filters": filt, "hitsPerPage": 1})
        print(filt, "->", dd["nbHits"])
    except Exception as e:
        print(filt, "ERR", e)

# text search by city
for city in ["Johannesburg", "Cape Town", "Durban", "Pretoria"]:
    dd = q({"query": city, "hitsPerPage": 3})
    print("text", city, "->", dd["nbHits"], [h.get("name") for h in dd["hits"][:3]])

# facet on venue
try:
    dd = q({"query": "", "facets": ["venue.city"], "hitsPerPage": 0})
    print("facets venue.city", dd.get("facets"))
except Exception as e:
    print("facets err", e)

# inspect venue structure across hits
d = q({"query": "Johannesburg", "hitsPerPage": 5})
for h in d["hits"]:
    print("venue", h.get("venue"))
