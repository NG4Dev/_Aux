-- Discovery ingestion SQLite schema — mirrors Convex domain (Phase 1 local store)
-- See domain_model_decisions.md §13–§15

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    city_slug TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    status TEXT NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'completed', 'completed_with_warnings', 'failed', 'skipped_fresh')),
    records_found INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    error_message TEXT,
    metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    slug TEXT,
    name TEXT NOT NULL,
    description TEXT,
    place_kind TEXT DEFAULT 'venue',
    address TEXT,
    lat REAL,
    lng REAL,
    website TEXT,
    google_maps_url TEXT,
    menu_listing_url TEXT,
    phone TEXT,
    google_raw_json TEXT,
    photo_urls_json TEXT,
    raw_json TEXT,
    content_hash TEXT,
    last_scraped_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    slug TEXT,
    name TEXT NOT NULL,
    tagline TEXT,
    merchant_type TEXT DEFAULT 'other',
    description TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    linked_place_id INTEGER REFERENCES places(id),
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS organizers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    social_links_json TEXT,
    linked_merchant_id INTEGER REFERENCES merchants(id),
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    slug TEXT,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_datetime TEXT,
    end_datetime TEXT,
    timezone TEXT,
    date_precision TEXT DEFAULT 'datetime'
        CHECK (date_precision IN ('datetime', 'date', 'month', 'unknown')),
    organizer_id INTEGER REFERENCES organizers(id),
    venue_place_id INTEGER REFERENCES places(id),
    external_ticketing_url TEXT,
    image_url TEXT,
    rsvp_count INTEGER,
    interest_count INTEGER,
    is_cancelled INTEGER DEFAULT 0,
    raw_json TEXT,
    content_hash TEXT,
    last_scraped_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    slug TEXT,
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT,
    image_url TEXT,
    social_links_json TEXT,
    raw_json TEXT,
    content_hash TEXT,
    last_scraped_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS event_performers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (event_id, artist_id)
);

CREATE TABLE IF NOT EXISTS entity_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL
        CHECK (entity_type IN ('place', 'merchant', 'event', 'artist', 'organizer')),
    canonical_entity_id INTEGER NOT NULL,
    alias_name TEXT NOT NULL,
    alias_source_provider TEXT,
    alias_source_external_id TEXT,
    city_slug TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (entity_type, alias_name, city_slug)
);

CREATE TABLE IF NOT EXISTS listing_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL
        CHECK (entity_type IN ('place', 'merchant', 'event', 'artist', 'organizer')),
    entity_id INTEGER NOT NULL,
    source_provider TEXT NOT NULL,
    listing_url TEXT NOT NULL,
    listing_title TEXT,
    first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    raw_json TEXT,
    UNIQUE (entity_type, entity_id, source_provider, listing_url)
);

CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    vetting_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (vetting_status IN ('pending', 'approved', 'rejected')),
    city_slug TEXT NOT NULL,
    slug TEXT,
    title TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    merchant_name TEXT,
    image_url TEXT,
    deal_url TEXT,
    valid_until TEXT,
    raw_json TEXT,
    content_hash TEXT,
    last_scraped_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    source_provider TEXT NOT NULL DEFAULT 'menu_web',
    source_external_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    category TEXT,
    source_url TEXT,
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (place_id, source_url, name)
);

CREATE TABLE IF NOT EXISTS catalog_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
    source_provider TEXT NOT NULL,
    source_external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    category TEXT,
    image_url TEXT,
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (source_provider, source_external_id)
);

CREATE TABLE IF NOT EXISTS source_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL
        CHECK (entity_type IN ('place', 'merchant', 'event', 'artist', 'organizer', 'deal')),
    entity_id INTEGER NOT NULL,
    source_provider TEXT NOT NULL,
    source_external_id TEXT,
    url TEXT NOT NULL,
    link_type TEXT DEFAULT 'listing',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (entity_type, entity_id, source_provider, url)
);

CREATE TABLE IF NOT EXISTS calendar_months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_slug TEXT NOT NULL,
    year_month TEXT NOT NULL,
    event_count INTEGER NOT NULL DEFAULT 0,
    artist_count INTEGER NOT NULL DEFAULT 0,
    deal_count INTEGER NOT NULL DEFAULT 0,
    top_genres_json TEXT,
    built_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (city_slug, year_month)
);

CREATE TABLE IF NOT EXISTS calendar_weeks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_slug TEXT NOT NULL,
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    event_count INTEGER NOT NULL DEFAULT 0,
    event_ids_json TEXT,
    built_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (city_slug, week_start)
);

CREATE TABLE IF NOT EXISTS trend_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_slug TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    signal_key TEXT NOT NULL,
    signal_value REAL NOT NULL,
    window_start TEXT,
    window_end TEXT,
    metadata_json TEXT,
    computed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (city_slug, signal_type, signal_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_places_city_vetting ON places(city_slug, vetting_status);
CREATE INDEX IF NOT EXISTS idx_events_city_vetting ON events(city_slug, vetting_status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_artists_city ON artists(city_slug);
CREATE INDEX IF NOT EXISTS idx_deals_city ON deals(city_slug);
CREATE INDEX IF NOT EXISTS idx_listing_signals_entity ON listing_signals(entity_type, entity_id);
