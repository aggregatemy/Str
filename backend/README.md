# Backend - Strażnik Prawa

Backend oparty na Node.js + Express do automatycznego monitorowania zmian w polskim prawodawstwie.

## Źródła danych

### RSS Feeds
- **ZUS** - Akty prawne i komunikaty
- **Monitor Polski** - Oficjalne ogłoszenia
- **Dziennik Ustaw** - Ustawy i rozporządzenia
- **Sejm RP** - Projekty ustaw

### Web Scraping
- **NFZ** - Zarządzenia Prezesa NFZ
- **GUS** - Komunikaty statystyczne

### API
- **ELI** - Internetowy System Aktów Prawnych (ISAP)

## Uruchomienie

```bash
npm install
npm run dev
```

Backend będzie dostępny na: `http://localhost:3001`

## Harmonogram

Dane są automatycznie odświeżane **co 1 godzinę**.

## API Endpoints

- `GET /api/v1/updates?range=7d&method=eli` - Lista aktów prawnych
- `GET /api/v1/stats` - Statystyki bazy danych
- `POST /api/v1/export/extract` - Eksport wybranych dokumentów
- `GET /api/v1/health` - Status serwera
