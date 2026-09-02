import sqlite3
c = sqlite3.connect("data/discovery.db")
print("howler jhb", c.execute(
    "SELECT COUNT(1) FROM events WHERE source_provider='howler' AND city_slug='johannesburg'"
).fetchone()[0])
print("total events", c.execute("SELECT COUNT(1) FROM events").fetchone()[0])
