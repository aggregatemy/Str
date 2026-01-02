# Strażnik Prawa - System Monitoringu Legislacji

System do automatycznego monitorowania i agregacji zmian w polskim prawodawstwie.

## Architektura

- **Backend**: Node.js + Express + Web Scraping
- **Frontend**: React + TypeScript + Vite
- **Źródła danych**: ELI API, RSS feeds (ZUS), NFZ web scraping

## Uruchomienie

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend uruchomi się na `http://localhost:3001`

### Frontend
```bash
npm install
npm run dev
```
Frontend uruchomi się na `http://localhost:5173`

## Źródła danych

1. **ELI API** - Internetowy System Aktów Prawnych (ISAP)
2. **RSS ZUS** - Akty prawne Zakładu Ubezpieczeń Społecznych
3. **NFZ Scraper** - Zarządzenia Prezesa NFZ

## API Endpoints

- `GET /api/v1/updates?range=7d&method=eli` - Lista aktów prawnych
- `POST /api/v1/export/extract` - Eksport wybranych dokumentów
- `GET /api/v1/health` - Status serwera

## Licencja

MIT

