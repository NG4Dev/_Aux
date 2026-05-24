"""Tests for Obsidian catalog export."""

from __future__ import annotations

import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
import sys

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.db.connection import init_db
from src.export import obsidian as obsidian_export


class ObsidianExportTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.vault = Path(self._tmpdir.name) / "vault"
        self.vault.mkdir()
        self.db_path = Path(self._tmpdir.name) / "test.db"
        self._env = os.environ.copy()
        os.environ["OBSIDIAN_VAULT_PATH"] = str(self.vault)
        os.environ["DISCOVERY_DB_PATH"] = str(self.db_path)
        self.conn = init_db()

    def tearDown(self) -> None:
        self.conn.close()
        os.environ.clear()
        os.environ.update(self._env)
        self._tmpdir.cleanup()

    def _insert_event(
        self,
        *,
        source_provider: str = "quicket",
        external_id: str,
        name: str,
        start_datetime: str | None = "2026-06-15T19:00:00",
    ) -> None:
        self.conn.execute(
            """
            INSERT INTO events (
                source_provider, source_external_id, city_slug, slug, name,
                start_datetime, vetting_status, last_scraped_at
            ) VALUES (?, ?, 'johannesburg', ?, ?, ?, 'pending', '2026-05-20T10:00:00')
            """,
            (source_provider, external_id, name.lower().replace(" ", "-"), name, start_datetime),
        )
        self.conn.commit()

    def _insert_place(self, *, external_id: str, name: str, place_kind: str = "venue") -> None:
        self.conn.execute(
            """
            INSERT INTO places (
                source_provider, source_external_id, city_slug, slug, name,
                place_kind, vetting_status, last_scraped_at
            ) VALUES ('google_places', ?, 'johannesburg', ?, ?, ?, 'pending', '2026-05-20T10:00:00')
            """,
            (external_id, name.lower().replace(" ", "-"), name, place_kind),
        )
        self.conn.commit()

    def _insert_artist(self, *, external_id: str, name: str, genre: str | None = "rock") -> None:
        self.conn.execute(
            """
            INSERT INTO artists (
                source_provider, source_external_id, city_slug, slug, name,
                genre, vetting_status, last_scraped_at
            ) VALUES ('bandsintown', ?, 'johannesburg', ?, ?, ?, 'pending', '2026-05-20T10:00:00')
            """,
            (external_id, name.lower().replace(" ", "-"), name, genre),
        )
        self.conn.commit()

    def test_vault_path_resolves_under_mission_control_layout(self) -> None:
        city_dir = obsidian_export.resolve_city_dir("johannesburg")
        expected = self.vault / "business" / "discovery-catalog" / "johannesburg"
        self.assertEqual(city_dir, expected)
        self.assertTrue(city_dir.is_dir())

    def test_entity_subfolder_rules(self) -> None:
        def fetch_row(table: str, **values: str | None) -> sqlite3.Row:
            if table == "events":
                self.conn.execute(
                    """
                    INSERT INTO events (
                        source_provider, source_external_id, city_slug, slug, name,
                        start_datetime, vetting_status
                    ) VALUES ('quicket', 'tmp', 'johannesburg', 'tmp', 'Tmp', ?, 'pending')
                    """,
                    (values.get("start_datetime"),),
                )
                row = self.conn.execute("SELECT * FROM events WHERE source_external_id = 'tmp'").fetchone()
            elif table == "places":
                self.conn.execute(
                    """
                    INSERT INTO places (
                        source_provider, source_external_id, city_slug, slug, name,
                        place_kind, vetting_status
                    ) VALUES ('google_places', 'tmp', 'johannesburg', 'tmp', 'Tmp', ?, 'pending')
                    """,
                    (values.get("place_kind"),),
                )
                row = self.conn.execute("SELECT * FROM places WHERE source_external_id = 'tmp'").fetchone()
            else:
                self.conn.execute(
                    """
                    INSERT INTO artists (
                        source_provider, source_external_id, city_slug, slug, name,
                        genre, vetting_status
                    ) VALUES ('bandsintown', 'tmp', 'johannesburg', 'tmp', 'Tmp', ?, 'pending')
                    """,
                    (values.get("genre"),),
                )
                row = self.conn.execute("SELECT * FROM artists WHERE source_external_id = 'tmp'").fetchone()
            self.conn.commit()
            assert row is not None
            return row

        self.assertEqual(
            obsidian_export.entity_subfolder("events", fetch_row("events", start_datetime="2026-06-15T19:00:00")),
            "2026-06",
        )
        self.assertEqual(
            obsidian_export.entity_subfolder("places", fetch_row("places", place_kind="Restaurant")),
            "restaurant",
        )
        self.assertEqual(
            obsidian_export.entity_subfolder("artists", fetch_row("artists", genre="Indie Rock")),
            "indie-rock",
        )

    def test_export_creates_subfolders_and_indexes(self) -> None:
        self._insert_event(external_id="e1", name="Summer Festival")
        self._insert_place(external_id="p1", name="The Venue", place_kind="venue")
        self._insert_artist(external_id="a1", name="Local Band", genre="rock")

        city_dir = obsidian_export.export_city(self.conn, "johannesburg")

        event_note = city_dir / "events" / "quicket" / "2026-06" / "quicket-e1.md"
        place_notes = list((city_dir / "places" / "google_places" / "venue").glob("google_places-*.md"))
        artist_notes = list((city_dir / "artists" / "bandsintown" / "rock").glob("bandsintown-*.md"))

        self.assertTrue(event_note.is_file())
        self.assertEqual(len(place_notes), 1)
        self.assertEqual(len(artist_notes), 1)
        self.assertTrue((city_dir / "events" / "quicket" / "_index.md").is_file())
        self.assertTrue((city_dir / "places" / "google_places" / "_index.md").is_file())

        city_indexes = list(city_dir.glob("Discovery-Catalog-*.md"))
        self.assertEqual(len(city_indexes), 1)
        city_index = city_indexes[0].read_text(encoding="utf-8")
        self.assertIn("Export Summary", city_index)
        self.assertIn("events/", city_index)
        self.assertNotIn("Summer Festival", city_index)

        source_index = (city_dir / "events" / "quicket" / "_index.md").read_text(encoding="utf-8")
        self.assertIn("By subfolder", source_index)
        self.assertIn("2026-06", source_index)

    def test_many_events_split_by_source_not_one_file(self) -> None:
        for i in range(150):
            self._insert_event(
                external_id=f"evt-{i}",
                name=f"Event Number {i}",
                source_provider="quicket" if i % 2 == 0 else "howler",
            )

        city_dir = obsidian_export.export_city(self.conn, "johannesburg")
        quicket_notes = list((city_dir / "events" / "quicket").rglob("*.md"))
        howler_notes = list((city_dir / "events" / "howler").rglob("*.md"))
        entity_notes = [p for p in quicket_notes + howler_notes if p.name != "_index.md"]

        self.assertEqual(len(entity_notes), 150)
        self.assertTrue(all(p.parent.name == "2026-06" for p in entity_notes))

    def test_filename_sanitization(self) -> None:
        self.conn.execute(
            """
            INSERT INTO events (
                source_provider, source_external_id, city_slug, slug, name,
                start_datetime, vetting_status
            ) VALUES ('quicket', 'x/1:wild', 'johannesburg', NULL, 'Wild & Crazy: Show!!!', '2026-07-01T20:00:00', 'pending')
            """
        )
        self.conn.commit()
        row = self.conn.execute("SELECT * FROM events WHERE source_external_id = 'x/1:wild'").fetchone()
        assert row is not None
        filename = obsidian_export.entity_filename("events", row)
        self.assertEqual(filename, "quicket-x-1-wild.md")

    def test_discover_cities_unions_all_tables(self) -> None:
        self.conn.execute(
            """
            INSERT INTO deals (
                source_provider, source_external_id, city_slug, slug, title, vetting_status
            ) VALUES ('hyperli', 'd1', 'cape-town', 'deal-one', 'Deal One', 'pending')
            """
        )
        self.conn.commit()
        cities = obsidian_export.discover_cities(self.conn)
        self.assertIn("cape-town", cities)


if __name__ == "__main__":
    unittest.main()
