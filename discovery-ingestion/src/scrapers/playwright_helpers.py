"""Shared Playwright scroll / load-more helpers."""

from __future__ import annotations

import time
from typing import Any


def auto_scroll_page(
    page,
    *,
    max_rounds: int = 25,
    pause_ms: int = 1200,
    step_px: int = 900,
    stable_rounds: int = 3,
) -> int:
    """Scroll down until document height stops growing."""
    last_height = 0
    stable = 0
    rounds = 0
    while rounds < max_rounds and stable < stable_rounds:
        rounds += 1
        page.evaluate(f"window.scrollBy(0, {step_px})")
        page.wait_for_timeout(pause_ms)
        height = page.evaluate("document.body.scrollHeight")
        if height <= last_height:
            stable += 1
        else:
            stable = 0
            last_height = height
    page.evaluate("window.scrollTo(0, 0)")
    return rounds


def click_load_more_buttons(
    page,
    *,
    max_clicks: int = 30,
    pause_ms: int = 1500,
) -> int:
    """Click common load-more / show-more buttons until none remain."""
    selectors = [
        "button:has-text('Load more')",
        "button:has-text('Show more')",
        "button:has-text('See more')",
        "button:has-text('View more')",
        "a:has-text('Load more')",
        "a:has-text('Show more')",
        "[data-testid='load-more']",
        ".load-more",
    ]
    clicks = 0
    for _ in range(max_clicks):
        clicked = False
        for sel in selectors:
            btn = page.query_selector(sel)
            if btn and btn.is_visible():
                try:
                    btn.click()
                    page.wait_for_timeout(pause_ms)
                    clicks += 1
                    clicked = True
                    break
                except Exception:
                    continue
        if not clicked:
            break
    return clicks


def scroll_until_count_stable(
    page,
    count_js: str,
    *,
    max_rounds: int = 30,
    pause_ms: int = 1500,
    stable_rounds: int = 3,
) -> int:
    """Run count_js after each scroll; stop when count stabilizes."""
    last_count = -1
    stable = 0
    for _ in range(max_rounds):
        count = page.evaluate(count_js)
        if count == last_count:
            stable += 1
            if stable >= stable_rounds:
                break
        else:
            stable = 0
            last_count = count
        page.evaluate("window.scrollBy(0, window.innerHeight)")
        page.wait_for_timeout(pause_ms)
        click_load_more_buttons(page, max_clicks=2, pause_ms=pause_ms)
    return int(last_count if last_count >= 0 else 0)
