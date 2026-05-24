"""Tests for city inference."""

from __future__ import annotations

import unittest

from src.scrapers.city_filter import assign_city_or_skip, infer_city_slug


class CityFilterTests(unittest.TestCase):
    def test_infer_johannesburg_from_venue(self) -> None:
        city, conf, reason = infer_city_slug("House Sundays at SunBet Arena Time Square")
        self.assertEqual(city, "johannesburg")
        self.assertGreater(conf, 0)
        self.assertIn("johannesburg", reason)

    def test_infer_cape_town(self) -> None:
        city, _conf, _reason = infer_city_slug("Spa package at V&A Waterfront Cape Town")
        self.assertEqual(city, "cape-town")

    def test_strict_mode_rejects_other_city(self) -> None:
        city, reason = assign_city_or_skip(
            "Comedy night in Green Point",
            strict_city="johannesburg",
            strict_city_name="Johannesburg",
        )
        self.assertIsNone(city)
        self.assertEqual(reason, "strict_no_match")

    def test_infer_mode_assigns_best_city(self) -> None:
        city, reason = assign_city_or_skip(
            "Wild X quad bike Atlantis Dunes Cape Town",
            strict_city=None,
        )
        self.assertEqual(city, "cape-town")
        self.assertIn("matched", reason)


if __name__ == "__main__":
    unittest.main()
