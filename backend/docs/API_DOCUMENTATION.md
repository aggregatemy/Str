# API Documentation - Strażnik Prawa Medycznego

## Overview

REST API dla backendu Strażnika Prawa Medycznego. Zgodne z specyfikacją OpenAPI 3.1.

**Base URL**: `http://localhost:3001/api/v1`

**Content-Type**: `application/json` (domyślnie)

## Authentication

Obecnie brak autentykacji. W przyszłości planowane JWT tokens.

## Endpoints

### Health Check

#### GET /health

Sprawdza status serwera.

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### Legal Updates

#### GET /api/v1/updates

Pobiera listę znormalizowanych faktów prawnych.

**Query Parameters**:

| Parameter | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| range | string | No | `7d`, `30d`, `90d` | Zakres czasowy (dni wstecz) |
| method | string | No | `eli`, `rss`, `scraper` | Filtr po źródle danych |

**Example Requests**:
```bash
# Wszystkie dokumenty
GET /api/v1/updates

# Dokumenty z ostatnich 7 dni
GET /api/v1/updates?range=7d

# Tylko dokumenty z NFZ
GET /api/v1/updates?method=scraper

# Kombinacja filtrów
GET /api/v1/updates?range=30d&method=eli
```

**Response**: `200 OK`
```json
[
  {
    "id": "nfz-12345",
    "ingestMethod": "scraper",
    "title": "Zarządzenie Nr 100/2024/DSOZ w sprawie wytycznych",
    "summary": "Wytyczne dotyczące realizacji świadczeń zdrowotnych",
    "date": "2024-01-15",
    "impact": "medium",
    "category": "Zarządzenie Prezesa NFZ",
    "legalStatus": "obowiązujący",
    "officialRationale": "Dokument określa zasady...",
    "sourceUrl": "https://baw.nfz.gov.pl/"
  },
  {
    "id": "eli-pol-2024-ustawa-123",
    "eliUri": "http://isap.sejm.gov.pl/eli/pol/2024/ustawa/123",
    "ingestMethod": "eli",
    "title": "Ustawa o zmianie ustawy o świadczeniach zdrowotnych",
    "summary": "Nowelizacja ustawy o świadczeniach...",
    "date": "2024-01-10",
    "impact": "high",
    "category": "Ustawa",
    "legalStatus": "obowiązujący",
    "officialRationale": "Uzasadnienie ustawodawcy...",
    "sourceUrl": "http://isap.sejm.gov.pl/..."
  }
]
```

**Error Responses**:

`400 Bad Request` - Invalid parameters
```json
{
  "error": "Invalid range parameter. Must be one of: 7d, 30d, 90d"
}
```

`500 Internal Server Error`
```json
{
  "error": "Failed to fetch updates"
}
```

---

### Export

#### POST /api/v1/export/extract

Generuje surowy wyciąg tekstowy z wybranych dokumentów.

**Request Body**:
```json
{
  "ids": ["nfz-12345", "eli-xyz"]
}
```

**Validation**:
- `ids` musi być niepustą tablicą stringów

**Response**: `200 OK`

**Content-Type**: `text/plain; charset=utf-8`

```
DOKUMENT: Zarządzenie Nr 100/2024/DSOZ w sprawie wytycznych
ID: nfz-12345
DATA: 2024-01-15
KATEGORIA: Zarządzenie Prezesa NFZ
STATUS: obowiązujący
RANGA: medium
ŹRÓDŁO: https://baw.nfz.gov.pl/

STRESZCZENIE:
Wytyczne dotyczące realizacji świadczeń zdrowotnych

UZASADNIENIE:
Dokument określa zasady realizacji świadczeń zdrowotnych w kontekście...

---

DOKUMENT: Ustawa o zmianie ustawy o świadczeniach zdrowotnych
ID: eli-xyz
ELI URI: http://isap.sejm.gov.pl/eli/pol/2024/ustawa/123
DATA: 2024-01-10
KATEGORIA: Ustawa
STATUS: obowiązujący
RANGA: high
ŹRÓDŁO: http://isap.sejm.gov.pl/...

STRESZCZENIE:
Nowelizacja ustawy o świadczeniach...

UZASADNIENIE:
Uzasadnienie ustawodawcy...

```

**Error Responses**:

`400 Bad Request` - Invalid request body
```json
{
  "error": "Invalid request body. \"ids\" must be a non-empty array"
}
```

`404 Not Found` - No documents found
```json
{
  "error": "No updates found for the provided IDs"
}
```

`500 Internal Server Error`
```json
{
  "error": "Failed to generate extract"
}
```

---

## Data Models

### LegalUpdate

Znormalizowany fakt prawny.

```typescript
{
  id: string;                    // Unikalny identyfikator
  eliUri?: string;               // ELI URI (tylko dla ELI)
  ingestMethod: 'eli' | 'rss' | 'scraper';
  title: string;                 // Oficjalny tytuł dokumentu
  summary: string;               // Faktograficzne streszczenie
  date: string;                  // Format: YYYY-MM-DD
  impact: 'low' | 'medium' | 'high';  // Ranga aktu
  category: string;              // Typ dokumentu
  legalStatus: string;           // Status prawny
  officialRationale: string;     // Oficjalne uzasadnienie
  sourceUrl?: string;            // Link do źródła
}
```

**Impact Levels**:
- `high` - Ustawa, konstytucja
- `medium` - Rozporządzenie, zarządzenie
- `low` - Komunikat, obwieszczenie

**Ingest Methods**:
- `eli` - ISAP ELI API
- `rss` - RSS feeds (ZUS, CEZ)
- `scraper` - NFZ scraper

---

## Error Handling

Wszystkie błędy zwracają JSON z polem `error`:

```json
{
  "error": "Error message here"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Obecnie brak rate limitingu. W przyszłości planowane:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## CORS

**Allowed Origins**:
- `http://localhost:5173` (development)
- Konfigurowane przez `CORS_ORIGIN` env variable

**Allowed Methods**: GET, POST, OPTIONS

**Allowed Headers**: Content-Type, Authorization

---

## Caching

Backend używa cache HTTP dla zewnętrznych API:
- NFZ API: 120 sekund TTL
- ELI API: Brak cache (live data)
- RSS feeds: Brak cache (live data)

Odpowiedzi z backendu nie są cachowane. Frontend może implementować własny cache.

---

## Pagination

Obecnie brak paginacji. Wszystkie wyniki zwracane w jednym requeście.

W przyszłości planowane:
```
GET /api/v1/updates?page=1&limit=50
```

---

## Examples

### cURL

```bash
# Fetch all updates
curl http://localhost:3001/api/v1/updates

# Fetch with filters
curl "http://localhost:3001/api/v1/updates?range=7d&method=scraper"

# Generate extract
curl -X POST http://localhost:3001/api/v1/export/extract \
  -H "Content-Type: application/json" \
  -d '{"ids": ["nfz-12345"]}'
```

### JavaScript (fetch)

```javascript
// Fetch updates
const response = await fetch('http://localhost:3001/api/v1/updates?range=7d');
const updates = await response.json();

// Generate extract
const extractResponse = await fetch('http://localhost:3001/api/v1/export/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: ['nfz-12345'] })
});
const extract = await extractResponse.text();
```

### TypeScript (axios)

```typescript
import axios from 'axios';

// Fetch updates
const { data } = await axios.get<LegalUpdate[]>(
  'http://localhost:3001/api/v1/updates',
  { params: { range: '7d', method: 'scraper' } }
);

// Generate extract
const { data: extract } = await axios.post<string>(
  'http://localhost:3001/api/v1/export/extract',
  { ids: ['nfz-12345'] },
  { headers: { 'Content-Type': 'application/json' } }
);
```

---

## Versioning

API versjonowane w URL: `/api/v1/...`

Aktualna wersja: **v1**

Breaking changes będą wprowadzane w nowych wersjach (v2, v3, etc.) z zachowaniem kompatybilności wstecznej dla v1.

---

## OpenAPI Specification

Pełna specyfikacja OpenAPI 3.1 znajduje się w pliku `openapi.yaml` w głównym katalogu projektu.

---

## Support

Dla problemów i pytań:
- GitHub Issues: https://github.com/aggregatemy/Str/issues
- Email: [dodaj email]

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- GET /api/v1/updates endpoint
- POST /api/v1/export/extract endpoint
- NFZ, ELI, RSS data sources
- SQLite storage
- Gemini normalization
