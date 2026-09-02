import httpx
import re
import json
from pathlib import Path

html = Path(__file__).parent.joinpath("howler_active.html").read_text(encoding="utf-8")
m = re.search(r"window\.APP_CONFIG = (\{.*?\});", html, re.S)
if m:
    # truncate at first }; that closes - might be tricky
    raw = m.group(1)
    # find balanced brace - simple approach: read until };window
    end = html.find("};window", m.start())
    if end > 0:
        raw = html[m.start() + len("window.APP_CONFIG = "): end + 1]
    try:
        cfg = json.loads(raw)
        print("APP_CONFIG keys", list(cfg.keys())[:20])
        print(json.dumps(cfg, indent=2)[:4000])
    except Exception as e:
        print("json fail", e, raw[:500])

js = httpx.get(
    "https://d1as2iufift1z3.cloudfront.net/vite/assets/events-BRrykK4M.js",
    timeout=30,
).text
print("\njs len", len(js))
api_paths = list(dict.fromkeys(re.findall(r'["\'](/api[^"\']+)["\']', js)))
print("api paths", api_paths[:30])
for term in ["active", "search", "listing", "events"]:
    idx = js.find(term)
    if idx >= 0:
        print(f"\n--- context {term} ---")
        print(js[max(0, idx - 80) : idx + 120])
