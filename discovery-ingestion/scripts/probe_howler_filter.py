import httpx

APP_ID = "K4FPULVWDS"
API_KEY = "cdec92c6ac1ad99de33520350ef41eee"
URL = f"https://{APP_ID.lower()}-dsn.algolia.net/1/indexes/Event/query"
headers = {"X-Algolia-Application-Id": APP_ID, "X-Algolia-API-Key": API_KEY}

def fetch_all(query):
    hits = []
    page = 0
    nb_pages = 1
    with httpx.Client(timeout=30) as client:
        while page < nb_pages:
            r = client.post(URL, json={"query": query, "hitsPerPage": 50, "page": page}, headers=headers)
            d = r.json()
            hits.extend(d["hits"])
            nb_pages = d["nbPages"]
            page += 1
    return hits

def in_city(hit, city_name):
    addr = (hit.get("venue") or {}).get("address") or ""
    name = hit.get("name") or ""
    tags = hit.get("tags") or []
    blob = f"{addr} {name} {' '.join(tags)}".lower()
    return city_name.lower() in blob

for city in ["Johannesburg", "Cape Town", "Durban", "Pretoria"]:
    hits = fetch_all(city)
    filtered = [h for h in hits if in_city(h, city)]
    print(city, "raw", len(hits), "filtered", len(filtered))
