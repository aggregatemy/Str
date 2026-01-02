# Strażnik Prawa - Backend

Backend server for the Strażnik Prawa legal monitoring system.

## Features

- **ELI API Scraper**: Fetches legal documents from the ISAP ELI API
- **RSS Scraper**: Monitors ZUS and CEZ RSS feeds
- **NFZ Web Scraper**: Scrapes NFZ order pages using Cheerio
- **Data Caching**: In-memory caching of scraped data
- **Scheduled Updates**: Automatic data refresh every 6 hours using node-cron
- **REST API**: Express-based API serving legal updates to the frontend

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

### GET /api/v1/updates

Get all legal updates with optional filtering.

**Query Parameters:**
- `range` (optional): Filter by date range - `7d`, `30d`, or `90d`
- `method` (optional): Filter by source - `eli`, `rss`, or `scraper`

**Response:**
```json
[
  {
    "id": "string",
    "ingestMethod": "eli|rss|scraper",
    "eliUri": "string|null",
    "title": "string",
    "summary": "string",
    "date": "YYYY-MM-DD",
    "impact": "low|medium|high",
    "category": "string",
    "legalStatus": "string",
    "officialRationale": "string",
    "sourceUrl": "string"
  }
]
```

### POST /api/v1/export/extract

Export selected legal updates as formatted text.

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

**Response:** Plain text export of selected documents

### GET /api/v1/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T06:00:00.000Z"
}
```

## Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── sources.ts          # Configuration of data sources
│   ├── scrapers/
│   │   ├── eliScraper.ts       # ELI API scraper
│   │   ├── rssScraper.ts       # RSS feed scraper
│   │   └── nfzScraper.ts       # NFZ web scraper
│   ├── services/
│   │   ├── dataService.ts      # Data management and caching
│   │   └── schedulerService.ts # Cron job scheduler
│   ├── routes/
│   │   └── api.ts              # API route definitions
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── server.ts               # Express server entry point
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
PORT=3001
NODE_ENV=development
```

## Data Sources

1. **ELI API**: `https://isap.sejm.gov.pl/api/eli`
2. **ZUS RSS**: `https://www.zus.pl/rss/akty-prawne`
3. **NFZ Orders**: `https://www.nfz.gov.pl/zarzadzenia-prezesa/`

## License

MIT
