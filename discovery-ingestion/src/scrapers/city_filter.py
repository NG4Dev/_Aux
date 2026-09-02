"""City name matching and inference for scrapers without reliable API facets."""

from __future__ import annotations

CITY_ALIASES: dict[str, list[str]] = {
    "johannesburg": [
        "johannesburg",
        "jhb",
        "sandton",
        "rosebank",
        "braamfontein",
        "soweto",
        "midrand",
        "randburg",
        "melville",
        "fourways",
        "gauteng",
        "sun city",
        "sunbet arena",
        "time square",
    ],
    "cape-town": [
        "cape town",
        "cpt",
        "claremont",
        "green point",
        "district six",
        "observatory",
        "stellenbosch",
        "bellville",
        "sea point",
        "camps bay",
        "western cape",
        "waterfront",
        "va waterfront",
    ],
    "durban": [
        "durban",
        "umhlanga",
        "pinetown",
        "ballito",
        "kwazulu-natal",
        "kwa-zulu",
        "kzn",
    ],
    "pretoria": [
        "pretoria",
        "pta",
        "centurion",
        "menlyn",
        "hatfield",
        "silver lakes",
    ],
}


def _combine_text(*text_blobs: str | None) -> str:
    return " ".join(x.strip() for x in text_blobs if x and x.strip())


def _score_city(blob: str, city_slug: str) -> float:
    blob_lower = blob.lower()
    aliases = CITY_ALIASES.get(city_slug, [])
    score = 0.0
    for index, term in enumerate(aliases):
        if term in blob_lower:
            score += 3.0 if index == 0 else 1.0
    return score


def text_matches_city(text: str, city_slug: str, city_name: str) -> bool:
    blob = (text or "").lower()
    terms = CITY_ALIASES.get(city_slug, [city_name.lower()])
    return any(term in blob for term in terms)


def city_conflicts(text: str, city_slug: str) -> bool:
    """True when another metro name appears more strongly than the target city."""
    blob = (text or "").lower()
    for slug, aliases in CITY_ALIASES.items():
        if slug == city_slug:
            continue
        primary = aliases[0]
        if primary in blob and not any(term in blob for term in CITY_ALIASES.get(city_slug, [])):
            return True
    return False


def infer_city_slug(*text_blobs: str | None) -> tuple[str | None, float, str]:
    """Return (city_slug, confidence 0-1, reason)."""
    blob = _combine_text(*text_blobs)
    if not blob:
        return None, 0.0, "no_text"

    scores = {slug: _score_city(blob, slug) for slug in CITY_ALIASES}
    best_score = max(scores.values())
    if best_score <= 0:
        return None, 0.0, "no_city_match"

    leaders = [slug for slug, score in scores.items() if score == best_score]
    if len(leaders) > 1:
        return None, 0.0, f"ambiguous:{','.join(sorted(leaders))}"

    city_slug = leaders[0]
    confidence = min(best_score / 3.0, 1.0)
    return city_slug, confidence, f"matched:{city_slug}"


def assign_city_or_skip(
    *text_blobs: str | None,
    strict_city: str | None = None,
    strict_city_name: str | None = None,
) -> tuple[str | None, str]:
    """
    Resolve city for a record.
    strict_city restores pre-insert gating against a single metro.
    """
    blob = _combine_text(*text_blobs)
    if strict_city:
        name = strict_city_name or strict_city.replace("-", " ").title()
        if not text_matches_city(blob, strict_city, name):
            return None, "strict_no_match"
        if city_conflicts(blob, strict_city):
            return None, "strict_conflict"
        return strict_city, "strict_match"

    city_slug, _confidence, reason = infer_city_slug(blob)
    if city_slug is None:
        return None, reason
    return city_slug, reason
