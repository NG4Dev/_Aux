"""Test Algolia keys against Quicket products index."""
import httpx

APP_ID = "QAUIPDMSEL"
URL = f"https://{APP_ID.lower()}-dsn.algolia.net/1/indexes/products/query"
KEYS = [
    "3171510c9eb84a7b70700652bcbd5cae",
    "ec5eb43c5ca4fd2aa3883ae2c131f731",
]

for key in KEYS:
    r = httpx.post(
        URL,
        json={"query": "", "filters": "city:'Johannesburg'", "hitsPerPage": 5, "page": 0},
        headers={"X-Algolia-Application-Id": APP_ID, "X-Algolia-API-Key": key},
        timeout=30,
    )
    print(key, r.status_code)
    if r.status_code == 200:
        data = r.json()
        print("  nbHits", data.get("nbHits"), "sample", [h.get("name") for h in data.get("hits", [])[:3]])
