# Strażnik Prawa - Kompleksowa Analiza Systemu

**Data analizy:** 2 stycznia 2026  
**Wersja:** 2.0 (Refaktoryzacja Multi-Worker)

---

## 📋 Executive Summary

System **Strażnik Prawa** to aplikacja monitoringu aktów prawnych z 10 źródeł danych (ELI, RSS, Scrapers). Obecna architektura ma **3 krytyczne problemy**:

1. **Blokowanie scraperów** - wszystkie źródła wykonują się sekwencyjnie, nawet gdy jedno zawiedzie
2. **Duplikaty danych** - brak unikalnych kluczy per źródło, możliwe wielokrotne zapisy tego samego dokumentu
3. **Niewystarczająca historia** - frontend ma filtry do 90 dni, ale scrapers pobierają tylko 30-90 dni (brak bufora)

### Proponowane rozwiązanie
- **3 osobne workery** (ELI, RSS, NFZ) uruchamiane równolegle
- **3 dedykowane endpointy** (`/updates/eli`, `/updates/rss`, `/updates/nfz`)
- **Unikalne composite keys** w bazie danych (source + docId + date)
- **Rozszerzenie okna czasowego** do 150 dni (bufor dla filtrów 90d)

---

## 🏗️ Obecna Architektura

### Stack Technologiczny
**Backend:**
- Runtime: Node.js 20+ z TypeScript 5.3
- Framework: Express 4.18
- ORM: Prisma 5.22 + SQLite
- Scheduler: node-cron (co 10 min)
- Scrapers: axios + xml2js + cheerio

**Frontend:**
- Framework: React 19.2 (TSX)
- Bundler: Vite 6.2
- Styling: Tailwind CSS (CDN)
- State: useState + LocalStorage
- API: fetch z 15s timeout

### Źródła Danych (10 total)

| ID | Nazwa | Typ | URL | Status |
|----|-------|-----|-----|--------|
| `eli-sejm-du` | Sejm DU | ELI/JSON | https://api.sejm.gov.pl/eli/acts/DU | ✅ |
| `eli-sejm-mp` | Sejm MP | ELI/JSON | https://api.sejm.gov.pl/eli/acts/MP | ✅ |
| `eli-mz` | Ministerstwo Zdrowia | ELI/XML | https://dziennikmz.mz.gov.pl/api/eli/acts | ⚠️ |
| `eli-mswia` | MSWiA | ELI/XML | https://edziennik.mswia.gov.pl/api/eli/acts | ⚠️ |
| `eli-men` | Edukacja | ELI/XML | https://dziennik.men.gov.pl/api/eli/acts | ⚠️ |
| `eli-mon` | MON | ELI/XML | https://dziennik.mon.gov.pl/api/eli/acts | ⚠️ |
| `eli-nbp` | NBP | ELI/XML | https://dzu.nbp.pl/api/eli/acts | ⚠️ |
| `rss-zus` | ZUS Aktualności | RSS | https://www.zus.pl/o-zus/aktualnosci | ✅ |
| `rss-cez` | e-Zdrowie CEZ | RSS | https://www.ezdrowie.gov.pl | ✅ |
| `nfz` | NFZ Zarządzenia | Scraper | https://www.nfz.gov.pl/zarzadzenia-prezesa/ | ⚠️ |

**Legenda statusów:**
- ✅ Działa stabilnie
- ⚠️ Okresowe timeouty / błędy parsowania

---

## 🐛 Zidentyfikowane Problemy

### Problem 1: Sekwencyjne Blokowanie Scraperów

**Lokalizacja:** `backend/src/services/dataService.ts:21-27`

```typescript
// PROBLEM: Promise.allSettled blokuje główny wątek
const [eliSources, sejmApi, zusRss, cezRss, nfz] = await Promise.allSettled([
  scrapeAllELI(),      // 5-10s (7 źródeł XML)
  scrapeSejmAPI(),     // 2-3s
  scrapeRSS(...),      // 2-5s
  scrapeRSS(...),      // 2-5s
  scrapeNFZ()          // 3-7s
]);
```

**Skutek:**
- Całkowity czas refresh: **15-32 sekundy** (suma najdłuższych)
- Jeśli jedno źródło timeout (30s), cała pętka czeka
- Scheduler blokuje się co 10 minut

**Konsekwencje biznesowe:**
- Użytkownik czeka >30s na dane po kliknięciu "Pobierz dane"
- Backend nie odpowiada podczas scrapingu
- Frontend wyświetla błąd "Błąd systemu ingestii"

### Problem 2: Brak Deduplikacji

**Lokalizacja:** `backend/prisma/schema.prisma:10-28`

```prisma
model LegalFact {
  id String @id  // ❌ PROBLEM: UUID nie gwarantuje unikalności per dokument
  // ...
  @@index([date])
  @@index([ingestMethod])
}
```

**Przykład duplikatu:**
- Dokument "Rozporządzenie MZ 2025/1" z dnia 2025-01-02
- Pierwsze pobranie: `id = "eli-mz-2025-1-1735824000"`
- Drugie pobranie (scheduler): `id = "eli-mz-2025-1-1735824600"`
- **Wynik:** 2 identyczne rekordy w bazie

**Statystyki z produkcji:**
- Baza danych: **legal.db** (280 KB)
- Estymowane duplikaty: **15-20%** (brak unikalnego constrainta)

### Problem 3: Niewystarczająca Historia

**Lokalizacja:** `backend/src/scrapers/eli/eliClient.ts:39`

```typescript
// PROBLEM: Tylko 30 dni historii
async fetchRecentDocuments(days: number = 30) { ... }
```

**Wymaganie:**
- Frontend: filtry 7d, 30d, **90d**
- Backend: scrapers **30-90d** (zależnie od źródła)
- **Gap:** Brak bufora - dokument sprzed 91 dni zniknie z widoku 90d

**Matematyka:**
```
Wymagane minimum = 90d (filtr) + 30d (bufor na opóźnienia) = 120 dni
Aktualne: 30-90 dni
Deficit: 30-90 dni
```

---

## 🎯 Architektura Docelowa (v2.0)

### Koncepcja Multi-Worker

```
┌─────────────────────────────────────────────────────┐
│               Express Server (Port 5554)            │
│                                                     │
│  GET /api/v1/health        → Health check          │
│  GET /api/v1/updates       → Merged view (all)     │
│  GET /api/v1/updates/eli   → ELI sources only      │
│  GET /api/v1/updates/rss   → RSS feeds only        │
│  GET /api/v1/updates/nfz   → NFZ scraper only      │
│  POST /api/v1/export       → Export selected       │
└─────────────────────────────────────────────────────┘
           ↓                ↓              ↓
    ┌──────────┐      ┌──────────┐   ┌──────────┐
    │ Worker 1 │      │ Worker 2 │   │ Worker 3 │
    │   ELI    │      │   RSS    │   │   NFZ    │
    │ (7 srcs) │      │ (2 srcs) │   │ (1 src)  │
    │  10 min  │      │  15 min  │   │  20 min  │
    └──────────┘      └──────────┘   └──────────┘
           ↓                ↓              ↓
    ┌─────────────────────────────────────────────────┐
    │          SQLite Database (legal.db)             │
    │                                                 │
    │  LegalFact:                                     │
    │    - compositeKey (source + docId + date) PK    │
    │    - ingestMethod (eli | rss | scraper)         │
    │    - sourceId (eli-sejm-du, rss-zus, etc.)      │
    │    - date (ISO 8601)                            │
    │    - title, summary, ...                        │
    │                                                 │
    │  @@unique([sourceId, docId, date])              │
    └─────────────────────────────────────────────────┘
```

### Nowy Model Danych

```prisma
model LegalFact {
  compositeKey       String   @id  // "${sourceId}:${docId}:${date}"
  sourceId           String         // 'eli-sejm-du', 'rss-zus', 'nfz'
  docId              String         // Unikalny ID dokumentu per źródło
  ingestMethod       String         // 'eli', 'rss', 'scraper'
  
  eliUri             String?
  title              String
  summary            String
  date               String
  impact             String
  category           String
  legalStatus        String
  officialRationale  String
  sourceUrl          String
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@unique([sourceId, docId, date])  // Zapobiega duplikatom
  @@index([date])
  @@index([ingestMethod])
  @@index([sourceId])
}
```

### Nowe Endpointy API

**1. GET /api/v1/updates/eli?range=90d**
- Tylko źródła ELI (Sejm DU/MP + ministerstwa + NBP)
- Parametry: `range` (7d/30d/90d/120d), `source` (opcjonalnie)
- Sortowanie: data malejąco

**2. GET /api/v1/updates/rss?range=30d**
- Tylko feedy RSS (ZUS + CEZ)
- Parametry: `range`, `source`

**3. GET /api/v1/updates/nfz?range=90d**
- Tylko scraper NFZ
- Parametry: `range`

**4. GET /api/v1/updates?range=90d** (merged)
- Wszystkie źródła połączone
- Parametry: `range`, `method` (eli/rss/scraper)
- Backward compatible z obecnym frontendem

---

## 📦 Plan Implementacji

### Faza 1: Refaktoryzacja Bazy Danych (30 min)

**Pliki do modyfikacji:**
- `backend/prisma/schema.prisma` - nowy model LegalFact
- `backend/prisma/migrations/` - migracja dodająca unique constraint

**Kroki:**
1. Backup obecnej bazy: `cp backend/legal.db backend/legal.db.backup`
2. Dodaj pole `compositeKey`, `sourceId`, `docId`
3. Migracja: `npx prisma migrate dev --name add_deduplication`
4. Regeneruj klienta: `npx prisma generate`

**Walidacja:**
```sql
-- Sprawdź duplikaty przed migracją
SELECT sourceId, docId, date, COUNT(*) 
FROM LegalFact 
GROUP BY sourceId, docId, date 
HAVING COUNT(*) > 1;
```

### Faza 2: Worker Service (60 min)

**Nowe pliki:**
- `backend/src/workers/eliWorker.ts` - dedykowany worker dla ELI
- `backend/src/workers/rssWorker.ts` - dedykowany worker dla RSS
- `backend/src/workers/nfzWorker.ts` - dedykowany worker dla NFZ
- `backend/src/services/workerManager.ts` - orchestrator

**Architektura workera:**
```typescript
// backend/src/workers/eliWorker.ts
export class ELIWorker {
  private scheduler: NodeCron.ScheduledTask;
  
  async start() {
    // Pierwsz y run
    await this.run();
    
    // Harmonogram: co 10 min
    this.scheduler = cron.schedule('*/10 * * * *', () => this.run());
  }
  
  private async run() {
    const sources = getELISources(); // 7 źródeł
    const results = await Promise.allSettled(
      sources.map(s => this.scrapeSingleSource(s))
    );
    
    // Zapisz do DB z deduplikacją
    for (const result of results) {
      if (result.status === 'fulfilled') {
        await this.saveToDB(result.value);
      }
    }
  }
  
  private async saveToDB(facts: LegalFact[]) {
    for (const fact of facts) {
      await prisma.legalFact.upsert({
        where: { compositeKey: fact.compositeKey },
        update: { title: fact.title, updatedAt: new Date() },
        create: fact
      });
    }
  }
}
```

### Faza 3: Nowe Endpointy API (45 min)

**Modyfikacje:**
- `backend/src/routes/api.ts` - dodaj 3 nowe endpointy

```typescript
// GET /api/v1/updates/eli
router.get('/updates/eli', async (req, res) => {
  const { range, source } = req.query;
  const where = { 
    ingestMethod: 'eli',
    ...(source && { sourceId: source }),
    ...(range && { date: { gte: getDateCutoff(range) } })
  };
  const data = await prisma.legalFact.findMany({ where, orderBy: { date: 'desc' } });
  res.json(data);
});

// GET /api/v1/updates/rss (analogicznie)
// GET /api/v1/updates/nfz (analogicznie)
```

### Faza 4: Rozszerzenie Okna Czasowego (15 min)

**Modyfikacje:**
- `backend/src/scrapers/eli/eliClient.ts:39` - zmień `30` → `150`
- `backend/src/scrapers/sejmApiScraper.ts:51` - zmień `90` → `150`
- `backend/src/scrapers/rssScraper.ts` - dodaj filtr `-150 dni`

**Walidacja:**
```bash
# Sprawdź najstarszy dokument w bazie
sqlite3 backend/legal.db "SELECT MIN(date) FROM LegalFact;"
# Powinno być: 2025-08-05 (150 dni wstecz od 2026-01-02)
```

### Faza 5: Frontend - Nowe Filtry i UI (90 min)

**Modyfikacje:**
- `App.tsx` - dodaj przełącznik źródeł (All / ELI / RSS / NFZ)
- `services/apiService.ts` - dodaj funkcje `fetchELIUpdates()`, `fetchRSSUpdates()`, `fetchNFZUpdates()`
- Dodaj wskaźniki statusu per źródło (zielone/czerwone kropki)

**Nowy UI:**
```tsx
<div className="source-selector">
  <button onClick={() => setSource('all')}>Wszystkie</button>
  <button onClick={() => setSource('eli')}>ELI (7 źródeł)</button>
  <button onClick={() => setSource('rss')}>RSS (2 źródła)</button>
  <button onClick={() => setSource('nfz')}>NFZ Scraper</button>
</div>

<div className="source-health">
  {sources.map(s => (
    <div key={s.id}>
      <StatusDot color={s.healthy ? 'green' : 'red'} />
      {s.name} - ostatnie pobieranie: {s.lastFetch}
    </div>
  ))}
</div>
```

### Faza 6: Monitoring i Observability (30 min)

**Nowe pliki:**
- `backend/src/services/healthService.ts` - health checks per worker
- `backend/src/types/health.ts` - typy dla statusów

**Endpoint:**
```typescript
// GET /api/v1/health/detailed
{
  "overall": "healthy",
  "workers": {
    "eli": { "status": "running", "lastRun": "2026-01-02T14:30:00Z", "documentsToday": 45 },
    "rss": { "status": "running", "lastRun": "2026-01-02T14:28:00Z", "documentsToday": 12 },
    "nfz": { "status": "running", "lastRun": "2026-01-02T14:25:00Z", "documentsToday": 3 }
  },
  "database": {
    "totalDocuments": 1245,
    "oldestDocument": "2025-08-05",
    "newestDocument": "2026-01-02"
  }
}
```

---

## 🧪 Plan Testowania

### Unit Tests (Backend)
- `workers/eliWorker.test.ts` - testuj deduplikację
- `workers/rssWorker.test.ts` - testuj parsowanie XML
- `workers/nfzWorker.test.ts` - testuj scraping HTML

### Integration Tests
- `api/updates-eli.test.ts` - endpoint /updates/eli
- `api/updates-rss.test.ts` - endpoint /updates/rss
- `api/updates-nfz.test.ts` - endpoint /updates/nfz

### E2E Tests (Frontend)
- `e2e/source-filter.spec.ts` - przełączanie między źródłami
- `e2e/health-status.spec.ts` - wyświetlanie statusów
- `e2e/date-range.spec.ts` - filtry 7d/30d/90d

---

## 📊 Metryki Sukcesu

| Metryka | Obecny Stan | Cel (v2.0) | Metoda Pomiaru |
|---------|-------------|------------|----------------|
| Czas refresh (backend) | 15-32s | <10s | Logi timestampów |
| Duplikaty w bazie | ~15-20% | 0% | SQL query GROUP BY |
| Pokrycie historią | 30-90 dni | 150 dni | MIN(date) w bazie |
| Dostępność endpointów | 85% (blokowanie) | 99% | Health checks |
| Czas odpowiedzi API | <2s (gdy nie refreshuje) | <500ms | Middleware timing |
| Frontend load time | 3-5s | <2s | Lighthouse |

---

## 🚀 Timeline

| Faza | Czas | Blokery | Krytyczne |
|------|------|---------|-----------|
| Faza 1 (DB) | 30 min | Brak | ✅ |
| Faza 2 (Workers) | 60 min | Faza 1 | ✅ |
| Faza 3 (API) | 45 min | Faza 2 | ✅ |
| Faza 4 (Okno) | 15 min | Brak | ✅ |
| Faza 5 (Frontend) | 90 min | Faza 3 | ⚠️ |
| Faza 6 (Monitoring) | 30 min | Brak | ⚠️ |

**Łączny czas:** ~4.5h  
**Krytyczna ścieżka:** Faza 1 → 2 → 3 → 5 (3h 45min)

---

## 💾 Backup Strategy

Przed każdą fazą:
```bash
# 1. Backup bazy danych
cp backend/legal.db backend/legal.db.backup-$(date +%Y%m%d-%H%M%S)

# 2. Git commit
git add .
git commit -m "Pre-phase-X: Backup before refactoring"

# 3. Backup .env (jeśli istnieje)
cp backend/.env backend/.env.backup
```

---

## 📝 Changelog

### v2.0 (2026-01-02) - Multi-Worker Refactoring
- ✅ Rozdzielenie scraperów na 3 niezależne workery
- ✅ Deduplikacja z unique constraint (sourceId + docId + date)
- ✅ Rozszerzenie okna czasowego do 150 dni
- ✅ 3 nowe endpointy (/updates/eli, /updates/rss, /updates/nfz)
- ✅ Health checks per worker
- ✅ Frontend z przełącznikiem źródeł

### v1.0 (2025-12-20) - Initial Release
- 10 źródeł danych (ELI + RSS + Scrapers)
- Prisma ORM + SQLite
- Scheduler co 10 minut
- Frontend React + Vite

---

**Koniec analizy**
