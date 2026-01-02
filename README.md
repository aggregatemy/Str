# Strażnik Prawa Medycznego

System monitoringu zmian w prawie medycznym RP z pełnym backendem Node.js/TypeScript.

## Architektura

### Backend (Node.js/TypeScript)
- **NFZ Scraper** - Automatyczny scraping zarządzeń Prezesa NFZ (co godzinę)
- **ELI Client** - Integracja z ISAP Sejm API
- **RSS Client** - Agregacja komunikatów ZUS i CEZ
- **SQLite Database** - Przechowywanie znormalizowanych danych
- **REST API** - OpenAPI 3.1 compliant
- **Email Reports** - Codzienne raporty o 8:00 rano

### Frontend (React + TypeScript)
- **React 19** z TypeScript
- **Vite** jako bundler
- **Zero AI** - czysty interfejs prezentacyjny
- **Backend Integration** - komunikacja przez REST API

## Struktura katalogów

```
├── backend/              # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── scrapers/    # NFZ, ELI, RSS clients
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API endpoints
│   │   ├── jobs/        # Cron jobs
│   │   └── db/          # Database schema
│   ├── tests/           # 36 tests (100% pass)
│   └── docs/            # Complete documentation
├── components/          # React components
├── services/            # Frontend API service
└── App.tsx             # Main application
```

## Instalacja

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edytuj .env i ustaw zmienne środowiskowe
npm run build
npm start
```

Backend uruchomi się na `http://localhost:3001`

### Frontend

```bash
npm install
cp .env.example .env
# Edytuj .env jeśli backend działa na innym porcie
npm run dev
```

Frontend uruchomi się na `http://localhost:5173`

## Konfiguracja

### Backend (.env)

```env
# Server
PORT=3001
HOST=0.0.0.0

# Email Reports
EMAIL_RECIPIENTS=slawomir@lopuszanski.eu,slopuszanski@gabos.pl
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cron Schedules
CRON_SCHEDULE=0 * * * *          # Hourly sync
EMAIL_CRON_SCHEDULE=0 8 * * *    # Daily email at 8:00 AM
```

### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:3001
```

## API Endpoints

### GET /api/v1/updates

Pobiera znormalizowane fakty prawne z backendu.

**Query Parameters:**
- `range` (optional): `7d` | `30d` | `90d`
- `method` (optional): `eli` | `rss` | `scraper`

**Example:**
```bash
curl http://localhost:3001/api/v1/updates?range=7d&method=scraper
```

### POST /api/v1/export/extract

Generuje wyciąg tekstowy z wybranych dokumentów.

**Request Body:**
```json
{
  "ids": ["nfz-12345", "eli-xyz"]
}
```

**Response:** `text/plain`

## Funkcjonalności

### Backend
- ✅ Automatyczna synchronizacja (co godzinę)
- ✅ Scraping NFZ (adapter z projektu Franka Łopuszańskiego)
- ✅ Integracja ISAP ELI API
- ✅ Agregacja RSS (ZUS/CEZ)
- ✅ SQLite storage z migracjami
- ✅ REST API OpenAPI 3.1
- ✅ Codzienne raporty email (8:00 rano)
- ✅ Zero AI/Gemini - tylko mapowanie 1:1

### Frontend
- ✅ Wyświetlanie faktów prawnych z backendu
- ✅ Filtrowanie po zakresie czasowym (7d/30d/90d)
- ✅ Archiwizacja dokumentów (localStorage)
- ✅ Generowanie wyciągów faktograficznych
- ✅ Konfiguracja źródeł danych
- ✅ Responsive design

## Testy

### Backend
```bash
cd backend
npm test                 # All tests
npm run test:coverage    # With coverage
```

**Wyniki:** 36/36 testów przechodzi (100%)

### Frontend
```bash
npm run build           # Verify build
```

## Deployment

### Backend Production

```bash
cd backend
npm run build
NODE_ENV=production npm start
```

Zalecane: PM2 lub systemd service (zobacz `backend/docs/DEPLOYMENT.md`)

### Frontend Production

```bash
npm run build
```

Output znajduje się w katalogu `dist/`. Można deploy na:
- Netlify
- Vercel
- GitHub Pages
- Lub dowolny static hosting

## Dokumentacja

- **Backend**: `backend/README.md` i `backend/docs/`
- **API**: `backend/docs/API_DOCUMENTATION.md`
- **Architektura**: `backend/docs/ARCHITECTURE.md`
- **Deployment**: `backend/docs/DEPLOYMENT.md`
- **Attribution**: `backend/docs/ATTRIBUTION.md`

## Zero AI Assessment

System działa w modelu **"Zero AI Assessment"**:
- Backend NIE używa AI do oceny ani interpretacji
- Gemini został usunięty z frontendu
- Tylko bezpośrednie mapowanie 1:1 pól źródłowych
- Frontend jest czystym interfejsem prezentacyjnym

## Atrybuty

NFZ Scraper oparty na projekcie:
- **Autor**: Franek Łopuszański (Frankoslaw)
- **Repo**: https://github.com/Frankoslaw/nfz-baw-scrapper
- **Adaptacja**: Python → TypeScript

Zobacz `backend/docs/ATTRIBUTION.md` dla szczegółów.

## Licencja

MIT - zobacz `backend/LICENSE`

## Support

- **GitHub Issues**: https://github.com/aggregatemy/Str/issues
- **Backend Logs**: `backend/logs/backend.log`
- **Email**: slawomir@lopuszanski.eu

## Changelog

### v1.0.0 (2026-01-02)
- ✅ Pełny backend Node.js/TypeScript
- ✅ NFZ scraper (co godzinę)
- ✅ ELI + RSS clients
- ✅ SQLite storage
- ✅ REST API
- ✅ Daily email reports
- ✅ Frontend integration (bez Gemini)
- ✅ 36 testów (100% pass rate)
- ✅ Zero security vulnerabilities
- ✅ Complete documentation
