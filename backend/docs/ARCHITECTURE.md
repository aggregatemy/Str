# Architektura Backend - Strażnik Prawa Medycznego

## Przegląd

Backend Strażnika Prawa Medycznego to system Node.js/TypeScript zaprojektowany do automatycznego monitorowania zmian w prawie medycznym RP. System agreguje dane z trzech źródeł (NFZ, ISAP ELI, RSS) i normalizuje je do ujednoliconego formatu.

## Zasady Architektoniczne

### Zero AI Assessment

System działa w modelu "Zero AI Assessment" - **Gemini nie dokonuje oceny ani interpretacji**. AI pełni jedynie rolę mechanicznego parsera, przekształcającego surowe dane na strukturalny format JSON.

### Warstwy Systemu

```
┌─────────────────────────────────────────────┐
│           API Layer (Express)               │
│  GET /api/v1/updates                        │
│  POST /api/v1/export/extract                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Services Layer                      │
│  - Storage Service (SQLite)                 │
│  - Normalization Service (Gemini)           │
│  - Deduplication Service                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Data Ingestion Layer                │
│  - NFZ Scraper                              │
│  - ELI Client                               │
│  - RSS Client                               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         External Sources                    │
│  - baw.nfz.gov.pl                          │
│  - isap.sejm.gov.pl                        │
│  - zus.pl, ceidg.gov.pl (RSS)              │
└─────────────────────────────────────────────┘
```

## Komponenty Systemu

### 1. Data Ingestion Layer

#### NFZ Scraper (`src/scrapers/nfz-scraper.ts`)

**Zadanie**: Pobieranie zarządzeń Prezesa NFZ z API BAW.

**Technologia**:
- Axios z cache HTTP (TTL: 120s)
- Adapter z projektu Franka Łopuszańskiego

**Endpointy**:
- `/api/documents/GetDocumentsNewGrid` - lista dokumentów
- `/api/documents/{institutionId}/details/{documentId}/null` - szczegóły
- `/api/file/GetAttachment/{institutionId}/{fileId}` - załączniki
- `/api/file/GetZipxAttachment/{institutionId}/{fileId}` - załączniki ZIP

**Dane wyjściowe**:
```typescript
{
  Id: number,
  InstitutionId: number,
  Title: string,
  Subject: string,
  Date: string,
  Type: string
}
```

#### ELI Client (`src/scrapers/eli-client.ts`)

**Zadanie**: Pobieranie aktów prawnych z ISAP ELI API.

**Endpointy**:
- `/api/eli/search` - wyszukiwanie aktów
- `/api/eli/document?uri=...` - szczegóły aktu

**Filtry**:
- Data publikacji
- Typ aktu (ustawa, rozporządzenie, etc.)
- Słowa kluczowe (zdrowie, NFZ, etc.)

#### RSS Client (`src/scrapers/rss-client.ts`)

**Zadanie**: Agregacja RSS z ZUS i CEZ.

**Źródła**:
- `https://www.zus.pl/rss`
- `https://prod.ceidg.gov.pl/rss`

**Parsing**: XML → JSON (xml2js)

### 2. Services Layer

#### Normalization Service (`src/services/normalization.ts`)

**Zadanie**: Przekształcenie surowych danych na ujednolicony format `LegalUpdate`.
- `normalizeNFZData()` - NFZ → LegalUpdate
- `normalizeELIData()` - ELI → LegalUpdate
- `normalizeRSSData()` - RSS → LegalUpdate

**Prompt dla Gemini**:
```
Jesteś BEZSTRONNYM AUTOMATEM FORMATUJĄCYM.
ZADANIE: Przekształć surowe dane na format JSON.

RYGORYSTYCZNE ZASADY:
1. ZAKAZ DOKONYWANIA OCENY
2. ZAKAZ ANALIZY SKUTKÓW
3. EKSTRAKCJA 1:1 z pól źródłowych
4. Pole 'officialRationale': tylko oficjalne uzasadnienie lub "Brak danych źródłowych"
```

**Wynik**:
```typescript
{
  id: string,
  ingestMethod: 'eli' | 'rss' | 'scraper',
  title: string,
  summary: string,
  date: string,
  impact: 'low' | 'medium' | 'high',
  category: string,
  legalStatus: string,
  officialRationale: string,
  sourceUrl?: string
}
```

#### Storage Service (`src/services/storage.ts`)

**Zadanie**: Zarządzanie bazą danych SQLite.

**Tabele**:
- `legal_updates` - znormalizowane fakty prawne
- `attachments` - załączniki (pliki XML/PDF)

**Metody**:
- `saveLegalUpdate()` - zapis dokumentu
- `getLegalUpdates()` - pobieranie z filtrami
- `getLegalUpdatesByIds()` - pobieranie po ID
- `saveAttachment()` - zapis załącznika

#### Deduplication Service (`src/services/deduplication.ts`)

**Zadanie**: Wykrywanie duplikatów.

**Strategia**:
- Unikalny ID dla każdego źródła:
  - NFZ: `nfz-{Id}`
  - ELI: `{eliUri}` lub `eli-{id}`
  - RSS: `{guid}` lub `{link}`

**Metody**:
- `exists(id)` - sprawdzenie czy dokument istnieje
- `filterNew(documents)` - filtrowanie nowych dokumentów

#### Email Service (`src/services/email.ts`)

**Zadanie**: Wysyłanie raportów email z powiadomieniami o zmianach.

**Konfiguracja**:
- Nodemailer jako SMTP client
- Obsługa wielu dostawców (Gmail, SendGrid, Mailgun, etc.)
- HTML + plain text format

**Metody**:
- `sendDailyReport(updates, recipients)` - wysyłka dziennego raportu
- `testConnection()` - test połączenia SMTP
- `generateReportHTML(updates)` - generowanie HTML
- `generateReportText(updates)` - generowanie plain text

**Format raportu**:
- Podsumowanie statystyk (liczba zmian, źródła, priorytety)
- Grupowanie po priorytecie (wysoki/średni/niski)
- Szczegóły każdej zmiany (tytuł, data, kategoria, uzasadnienie)
- Linki do źródeł

### 3. Cron Jobs

#### Hourly Sync (`src/jobs/hourly-sync.ts`)

**Harmonogram**: Co godzinę (domyślnie `0 * * * *`)

**Proces**:
1. **NFZ Sync**: Pobierz dokumenty z ostatnich 24h
2. **ELI Sync**: Pobierz akty z ostatnich 7 dni
3. **RSS Sync**: Pobierz wpisy z ZUS i CEZ

**Flow dla każdego źródła**:
```
1. Fetch data from source
2. Filter out duplicates (deduplication)
3. Fetch details if needed
4. Normalize data (Gemini)
5. Save to database
6. Download attachments (NFZ only)
```

#### Daily Email Report (`src/jobs/daily-email.ts`)

**Harmonogram**: Codziennie rano (domyślnie `0 8 * * *` - 8:00 AM)

**Proces**:
1. **Query** - Pobierz aktualizacje z ostatnich 24h z bazy
2. **Filter** - Filtruj po dacie (ostatnie 24h)
3. **Format** - Wygeneruj raport HTML i plain text
4. **Send** - Wyślij email do skonfigurowanych odbiorców
5. **Log** - Zaloguj status wysyłki

**Odbiorcy** (z .env):
```
EMAIL_RECIPIENTS=slawomir@lopuszanski.eu,slopuszanski@gabos.pl
```

**Format raportu**:
- Nagłówek z datą i liczbą zmian
- Podsumowanie statystyk (źródła, priorytety)
- Zmiany pogrupowane po priorytecie (wysoki → średni → niski)
- Szczegóły każdej zmiany (tytuł, streszczenie, uzasadnienie, link)
- Footer z informacjami o systemie

### 4. API Layer (`src/routes/`)

#### GET /api/v1/updates

**Parametry**:
- `range` (optional): `7d` | `30d` | `90d`
- `method` (optional): `eli` | `rss` | `scraper`

**Odpowiedź**:
```json
[
  {
    "id": "nfz-12345",
    "ingestMethod": "scraper",
    "title": "Zarządzenie Nr 100/2024",
    "summary": "Wytyczne dotyczące...",
    "date": "2024-01-15",
    "impact": "medium",
    "category": "Zarządzenie",
    "legalStatus": "obowiązujący",
    "officialRationale": "...",
    "sourceUrl": "https://baw.nfz.gov.pl/"
  }
]
```

#### POST /api/v1/export/extract

**Request Body**:
```json
{
  "ids": ["nfz-12345", "eli-xyz"]
}
```

**Odpowiedź**: `text/plain`
```
DOKUMENT: Zarządzenie Nr 100/2024
ID: nfz-12345
DATA: 2024-01-15
...

---

DOKUMENT: Ustawa o...
ID: eli-xyz
...
```

## Baza Danych (SQLite)

### Schema

```sql
CREATE TABLE legal_updates (
  id TEXT PRIMARY KEY,
  eli_uri TEXT,
  ingest_method TEXT CHECK(ingest_method IN ('eli', 'rss', 'scraper')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  date TEXT NOT NULL,
  impact TEXT CHECK(impact IN ('low', 'medium', 'high')),
  category TEXT NOT NULL,
  legal_status TEXT NOT NULL,
  official_rationale TEXT NOT NULL,
  source_url TEXT,
  raw_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legal_update_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content BLOB NOT NULL,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (legal_update_id) REFERENCES legal_updates(id)
);
```

### Indeksy

```sql
CREATE INDEX idx_ingest_method ON legal_updates(ingest_method);
CREATE INDEX idx_date ON legal_updates(date DESC);
CREATE INDEX idx_impact ON legal_updates(impact);
CREATE INDEX idx_attachments_legal_update ON attachments(legal_update_id);
```

## Logging

**Biblioteka**: Winston

**Poziomy**:
- `error` - błędy krytyczne
- `warn` - ostrzeżenia
- `info` - informacje o procesach
- `debug` - szczegóły techniczne

**Transporty**:
- Console (z kolorowaniem)
- File (`./logs/backend.log`, rotacja 5x5MB)

## Error Handling

**Klasy błędów**:
- `AppError` - bazowa klasa błędów aplikacji
- `ValidationError` (400)
- `NotFoundError` (404)
- `UnauthorizedError` (401)
- `InternalServerError` (500)

**Middleware**: Centralna obsługa błędów w `src/app.ts`

## Security

**Middleware**:
- `helmet` - HTTP security headers
- `cors` - CORS policy (whitelist)

**Walidacja**:
- Parametry zapytań (range, method)
- Request body (ids array)
- URL whitelist dla sourceUrl (*.gov.pl, *.zus.pl)

## Performance

**Optymalizacje**:
- Cache HTTP (axios-cache-interceptor, TTL: 120s)
- Indeksy bazodanowe
- In-memory database dla testów
- Batch processing w cron jobs

## Monitoring

**Metryki**:
- Health check endpoint: `/health`
- Logi z timestampami
- Error tracking w logach

## Deployment

**Wymagania**:
- Node.js ≥18.0.0
- Gemini API Key
- Dostęp do portów: 3001 (default)

**Zmienne środowiskowe**: Zobacz `.env.example`

## Testy

**Framework**: Jest + ts-jest

**Typy**:
- Unit tests (scrapers, services)
- Integration tests (API endpoints)

**Coverage**: Target 80%

**Komendy**:
```bash
npm test              # Wszystkie testy
npm run test:watch    # Watch mode
npm run test:coverage # Z pokryciem
```

## Rozszerzenia

### Dodanie nowego źródła danych

1. Utwórz client w `src/scrapers/`
2. Dodaj metodę normalizacji w `NormalizationService`
3. Dodaj sync funkcję w `src/jobs/hourly-sync.ts`
4. Dodaj typ do `IngestMethod` w `src/types/`

### Dodanie nowego endpointu API

1. Utwórz router w `src/routes/`
2. Zarejestruj w `src/app.ts`
3. Dodaj testy w `tests/integration/`
4. Zaktualizuj dokumentację API

## Zależności

### Production
- express, axios, better-sqlite3
- node-cron, winston, nodemailer
- cors, helmet, dotenv
- axios-cache-interceptor, xml2js

### Development
- typescript, tsx, ts-jest
- jest, supertest
- eslint, @typescript-eslint/*

## Licencja

MIT License - Zobacz `LICENSE` dla szczegółów.

## Atrybuty

NFZ Scraper oparty na projekcie Franka Łopuszańskiego - Zobacz `docs/ATTRIBUTION.md`.
