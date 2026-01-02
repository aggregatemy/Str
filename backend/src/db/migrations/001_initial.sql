CREATE TABLE IF NOT EXISTS legal_updates (
  id TEXT PRIMARY KEY,
  eli_uri TEXT,
  ingest_method TEXT NOT NULL CHECK(ingest_method IN ('eli', 'rss', 'scraper')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  date TEXT NOT NULL,
  impact TEXT NOT NULL CHECK(impact IN ('low', 'medium', 'high')),
  category TEXT NOT NULL,
  legal_status TEXT NOT NULL,
  official_rationale TEXT NOT NULL,
  source_url TEXT,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingest_method ON legal_updates(ingest_method);
CREATE INDEX IF NOT EXISTS idx_date ON legal_updates(date DESC);
CREATE INDEX IF NOT EXISTS idx_impact ON legal_updates(impact);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legal_update_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content BLOB NOT NULL,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (legal_update_id) REFERENCES legal_updates(id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_legal_update ON attachments(legal_update_id);
