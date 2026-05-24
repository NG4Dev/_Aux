import httpx
import re

r = httpx.get("https://www.howler.co.za/active", timeout=30)
text = r.text
idx = text.find("window.APP_CONFIG")
print("found at", idx)
print(text[idx:idx+200])
# try patterns
for pat in [
    r"window\.APP_CONFIG\s*=\s*(\{.*?\});window\.",
    r"window\.APP_CONFIG\s*=\s*(\{.*?\});</script>",
    r"window\.APP_CONFIG\s*=\s*(\{.*?\})\s*;",
]:
    m = re.search(pat, text, re.S)
    print("pat", pat[:40], "match", bool(m))
    if m:
        print("len", len(m.group(1)))
