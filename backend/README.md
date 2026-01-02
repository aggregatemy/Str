# Strażnik Prawa Medycznego - Backend

Backend Node.js/TypeScript dla systemu monitoringu zmian w prawie medycznym RP.

## Funkcjonalności

- 🕐 **Automatyczny scraping NFZ** (co godzinę) - zarządzenia Prezesa NFZ
- 📡 **Integracja z ISAP ELI API** - akty prawne z Sejmu
- 📰 **Agregator RSS** (ZUS, CEZ) - komunikaty i obwieszczenia
- 🔄 **Normalizacja danych** (bez interpretacji AI) - mapowanie 1:1
- 💾 **SQLite database** - przechowywanie znormalizowanych danych
- 🔌 **REST API** zgodne z OpenAPI 3.1
- ✅ **Testy jednostkowe i integracyjne**
- 📝 **Szczegółowa dokumentacja**

## Wymagania

- Node.js >= 18.0.0
- npm >= 8.0.0

## Instalacja

```bash
cd backend
npm install
cp .env.example .env
# Edytuj .env jeśli potrzebne
```

## Uruchomienie

### Development
```bash
npm run dev
```

Server uruchomi się na `http://localhost:3001` z hot reload.

### Production
```bash
npm run build
npm start
```

## Testy

```bash
npm test                # Wszystkie testy
npm run test:watch      # Watch mode
npm run test:coverage   # Z pokryciem kodu
```

## Konfiguracja

### Zmienne środowiskowe (.env)

```env
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_PATH=./data/straznik.db

# Cron
ENABLE_CRON=true
CRON_SCHEDULE=0 * * * *

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/backend.log

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Harmonogram Cron

Domyślnie: `0 * * * *` (co godzinę, o pełnej godzinie)

Inne przykłady:
- `*/30 * * * *` - co 30 minut
- `0 */2 * * *` - co 2 godziny
- `0 9 * * *` - codziennie o 9:00

## API Endpoints

### GET /health

Sprawdza status serwera.

```bash
curl http://localhost:3001/health
```

### GET /api/v1/updates

Pobiera znormalizowane fakty prawne.

**Query params**:
- `range`: `7d` | `30d` | `90d` (zakres czasowy)
- `method`: `eli` | `rss` | `scraper` (źródło danych)

**Przykłady**:
```bash
# Wszystkie dokumenty
curl http://localhost:3001/api/v1/updates

# Dokumenty NFZ z ostatnich 7 dni
curl "http://localhost:3001/api/v1/updates?range=7d&method=scraper"

# Akty prawne z ostatnich 30 dni
curl "http://localhost:3001/api/v1/updates?range=30d&method=eli"
```

**Odpowiedź**:
```json
[
  {
    "id": "nfz-12345",
    "ingestMethod": "scraper",
    "title": "Zarządzenie Nr 100/2024/DSOZ",
    "summary": "Wytyczne dotyczące...",
    "date": "2024-01-15",
    "impact": "medium",
    "category": "Zarządzenie Prezesa NFZ",
    "legalStatus": "obowiązujący",
    "officialRationale": "Dokument określa...",
    "sourceUrl": "https://baw.nfz.gov.pl/"
  }
]
```

### POST /api/v1/export/extract

Generuje wyciąg tekstowy z wybranych dokumentów.

**Request body**:
```json
{
  "ids": ["nfz-12345", "eli-xyz"]
}
```

**Przykład**:
```bash
curl -X POST http://localhost:3001/api/v1/export/extract \
  -H "Content-Type: application/json" \
  -d '{"ids": ["nfz-12345"]}'
```

**Odpowiedź**: `text/plain`
```
DOKUMENT: Zarządzenie Nr 100/2024/DSOZ
ID: nfz-12345
DATA: 2024-01-15
...
```

## Architektura

```
src/
├── scrapers/         # Klienty źródeł danych
│   ├── nfz-scraper.ts    # NFZ BAW API
│   ├── eli-client.ts     # ISAP ELI API
│   └── rss-client.ts     # RSS feeds
├── services/         # Logika biznesowa
│   ├── normalization.ts  # Normalizacja danych (bez AI)
│   ├── storage.ts        # SQLite storage
│   └── deduplication.ts  # Wykrywanie duplikatów
├── routes/           # Express routes
│   ├── updates.ts        # GET /api/v1/updates
│   └── export.ts         # POST /api/v1/export/extract
├── jobs/             # Cron jobs
│   └── hourly-sync.ts    # Synchronizacja co godzinę
├── db/               # Database
│   ├── client.ts         # Database client
│   ├── schema.ts         # Schema definitions
│   └── migrations/       # SQL migrations
├── utils/            # Utilities
│   ├── logger.ts         # Winston logger
│   └── errors.ts         # Error classes
├── types/            # TypeScript types
│   └── index.ts
├── app.ts            # Express app configuration
└── server.ts         # Entry point
```

## Zasady Architektoniczne

### Zero AI Assessment

System **NIE UŻYWA AI** do oceny ani interpretacji. Normalizacja polega na:

1. **Mapowanie 1:1** pól źródłowych na format docelowy
2. **Ekstrakcja danych** bez analizy treści
3. **Klasyfikacja techniczna** na podstawie typu dokumentu (nie treści)

### Źródła Danych

1. **NFZ Scraper** - `https://baw.nfz.gov.pl/api`
   - Zarządzenia Prezesa NFZ
   - Załączniki XML/PDF
   - Cache HTTP (120s)

2. **ELI Client** - `https://isap.sejm.gov.pl/api/eli`
   - Ustawy, rozporządzenia
   - Metadane ELI
   - Live data (bez cache)

3. **RSS Client** - Feeds XML
   - ZUS: `https://www.zus.pl/rss`
   - CEZ: `https://prod.ceidg.gov.pl/rss`
   - Komunikaty i obwieszczenia

### Proces Synchronizacji

Co godzinę (domyślnie):

1. **Fetch** - Pobierz nowe dokumenty ze źródeł
2. **Deduplicate** - Odfiltruj duplikaty po ID
3. **Normalize** - Mapuj na format `LegalUpdate`
4. **Store** - Zapisz do SQLite
5. **Attachments** - Pobierz i zapisz załączniki (NFZ)

## Baza Danych

**SQLite** z dwoma tabelami:

- `legal_updates` - Znormalizowane fakty prawne
- `attachments` - Załączniki (pliki)

**Lokalizacja**: `./data/straznik.db` (lub konfigurowane w `.env`)

**Migracje**: Uruchamiane automatycznie przy starcie

## Logging

**Winston** z dwoma transportami:

- **Console** - Kolorowe logi w terminalu
- **File** - `./logs/backend.log` (rotacja 5x5MB)

**Poziomy**: error, warn, info (domyślny), debug

## Error Handling

Centralna obsługa błędów z klasami:
- `ValidationError` (400)
- `NotFoundError` (404)
- `InternalServerError` (500)

Wszystkie błędy logowane z pełnym stack trace.

## Security

- **Helmet** - HTTP security headers
- **CORS** - Whitelist origin
- **Validation** - Parametry i body
- **URL Whitelist** - Tylko *.gov.pl, *.zus.pl

## Atrybuty

Implementacja scrapera NFZ oparta na projekcie:
- **Autor**: Franek Łopuszański (Frankoslaw)
- **Repo**: https://github.com/Frankoslaw/nfz-baw-scrapper
- **Adaptacja**: Python → TypeScript

Zobacz [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md) dla szczegółów.

## Dokumentacja

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Szczegółowa architektura
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - Dokumentacja API
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment i konfiguracja
- [ATTRIBUTION.md](docs/ATTRIBUTION.md) - Atrybuty i licencje

## Licencja

MIT - zobacz [LICENSE](LICENSE)

## Development

### Struktura commitów

```bash
git commit -m "feat: add new endpoint"
git commit -m "fix: resolve database lock"
git commit -m "docs: update API documentation"
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

Output: `dist/` directory

### Watch Mode

```bash
npm run dev
```

Automatyczny restart przy zmianach w `src/`

## Troubleshooting

### Port Already in Use

```bash
lsof -i :3001
kill -9 <PID>
```

Lub zmień port w `.env`:
```env
PORT=3002
```

### Database Locked

SQLite może się zablokować przy równoczesnym dostępie.
- Upewnij się że tylko jedna instancja backendu pisze do bazy
- WAL mode jest włączony domyślnie (better-sqlite3)

### Cron Not Running

Sprawdź:
```bash
grep "hourly sync" logs/backend.log
```

Upewnij się:
```env
ENABLE_CRON=true
```

### Memory Leaks

Monitor:
```bash
ps aux | grep node
```

Jeśli rośnie pamięć:
- Sprawdź niedomknięte połączenia DB
- Przejrzyj event listenery
- Użyj Node.js heap snapshot

## FAQ

**Q: Czy backend wymaga Gemini API key?**  
A: Nie! System nie używa AI. Gemini został usunięty z normalizacji.

**Q: Jak często synchronizuje się z NFZ?**  
A: Co godzinę (domyślnie). Konfigurowane przez `CRON_SCHEDULE`.

**Q: Czy można uruchomić wiele instancji?**  
A: Tak, ale tylko jedna powinna mieć `ENABLE_CRON=true` aby uniknąć duplikatów.

**Q: Czy backend wspiera HTTPS?**  
A: Backend serwuje HTTP. Użyj reverse proxy (nginx) dla SSL/TLS.

**Q: Jak duża może być baza SQLite?**  
A: Teoretycznie do 281 TB. W praktyce sprawdzona do 1 TB.

## Support

- **Issues**: https://github.com/aggregatemy/Str/issues
- **Dokumentacja**: `docs/` directory
- **Logi**: `logs/backend.log`

## Contributors

- aggregatemy - Autor projektu
- Franek Łopuszański - Oryginalny NFZ scraper (Python)

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- NFZ, ELI, RSS data sources
- SQLite storage
- REST API (OpenAPI 3.1)
- Cron jobs
- Direct mapping normalization (no AI)
- Unit and integration tests
- Full documentation
