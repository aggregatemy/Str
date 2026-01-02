# Strażnik Prawa - Status Implementacji v2.0

**Data:** 2 stycznia 2026, 19:16  
**Wersja:** 2.0 Multi-Worker Architecture

---

## ✅ ZAIMPLEMENTOWANE (Fazy 1-4)

### Faza 1: Refaktoryzacja Bazy Danych ✅
- ✅ Dodano pola: `compositeKey`, `sourceId`, `docId`
- ✅ Migracja Prisma: `20260102181439_add_composite_fields_step1`
- ✅ Zachowano backward compatibility (stare pole `id` do usunięcia później)
- ✅ Indeksy na: `compositeKey`, `sourceId`, `date`, `ingestMethod`, `impact`

### Faza 2: Worker Service ✅
- ✅ `backend/src/workers/eliWorker.ts` - ELI Worker (10 min cycle)
- ✅ `backend/src/workers/rssWorker.ts` - RSS Worker (15 min cycle)
- ✅ `backend/src/workers/nfzWorker.ts` - NFZ Worker (20 min cycle)
- ✅ `backend/src/services/workerManager.ts` - Orchestrator
- ✅ Deduplikacja per źródło (upsert na compositeKey)
- ✅ Graceful shutdown (SIGTERM/SIGINT)

### Faza 3: Nowe Endpointy API ✅
- ✅ `GET /api/v1/updates/eli?range=90d&source=eli-sejm-du`
- ✅ `GET /api/v1/updates/rss?range=30d`
- ✅ `GET /api/v1/updates/nfz?range=90d`
- ✅ `GET /api/v1/health/detailed` - status workerów
- ✅ Backward compatible: `GET /api/v1/updates?range=90d&method=eli`
- ✅ Swagger dokumentacja zaktualizowana

### Faza 4: Rozszerzenie Okna Czasowego ✅
- ✅ ELI Client: `fetchRecentDocuments(150)` dni
- ✅ Sejm API Scraper: filtr `-150 dni`
- ✅ Wszystkie scrapers teraz pobierają 150 dni historii
- ✅ Bufor: 150 dni = 90 dni (filtr) + 30 dni (zapas) + 30 dni (margin)

---

## 🚧 DO ZROBIENIA (Fazy 5-6)

### Faza 5: Frontend - Nowe Filtry i UI (90 min) 🚧
**Priorytet:** WYSOKI

**Pliki do modyfikacji:**
1. `App.tsx` - dodać przełącznik źródeł (All / ELI / RSS / NFZ)
2. `services/apiService.ts` - nowe funkcje:
   - `fetchELIUpdates(range, source)`
   - `fetchRSSUpdates(range)`
   - `fetchNFZUpdates(range)`
3. Nowy komponent: `components/SourceSelector.tsx`
4. Nowy komponent: `components/SourceHealthIndicator.tsx`

**Nowy UI (szkic):**
```tsx
// SourceSelector.tsx
<div className="flex gap-2 mb-4">
  <button 
    className={źródło === 'all' ? 'bg-blue-600' : 'bg-gray-300'}
    onClick={() => setŹródło('all')}
  >
    Wszystkie (10 źródeł)
  </button>
  <button 
    className={źródło === 'eli' ? 'bg-green-600' : 'bg-gray-300'}
    onClick={() => setŹródło('eli')}
  >
    ELI (7 źródeł)
  </button>
  <button 
    className={źródło === 'rss' ? 'bg-purple-600' : 'bg-gray-300'}
    onClick={() => setŹródło('rss')}
  >
    RSS (2 źródła)
  </button>
  <button 
    className={źródło === 'nfz' ? 'bg-red-600' : 'bg-gray-300'}
    onClick={() => setŹródło('nfz')}
  >
    NFZ Scraper
  </button>
</div>

// SourceHealthIndicator.tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
  {healthStatus.workers.eli && (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${
        healthStatus.workers.eli.status === 'running' ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span>ELI: {healthStatus.workers.eli.documentsToday} docs</span>
    </div>
  )}
  {/* Analogicznie RSS i NFZ */}
</div>
```

**Logika w App.tsx:**
```tsx
const [źródło, setŹródło] = useState<'all' | 'eli' | 'rss' | 'nfz'>('all');
const [healthStatus, setHealthStatus] = useState(null);

useEffect(() => {
  // Pobierz status workerów co 30s
  const interval = setInterval(async () => {
    const status = await fetch('http://localhost:5554/api/v1/health/detailed').then(r => r.json());
    setHealthStatus(status);
  }, 30000);
  return () => clearInterval(interval);
}, []);

const pobierzDane = async () => {
  setLaduje(true);
  try {
    let wynik;
    switch (źródło) {
      case 'eli':
        wynik = await fetchELIUpdates(zakres);
        break;
      case 'rss':
        wynik = await fetchRSSUpdates(zakres);
        break;
      case 'nfz':
        wynik = await fetchNFZUpdates(zakres);
        break;
      default:
        wynik = await fetchLegalUpdates(zakres); // Stara funkcja (all)
    }
    setZmiany(wynik);
  } catch (err) {
    setBlad(err);
  } finally {
    setLaduje(false);
  }
};
```

### Faza 6: Monitoring i Observability (30 min) ⏳
**Priorytet:** ŚREDNI

**Pliki do stworzenia:**
1. `backend/src/services/healthService.ts` - agregacja statusów
2. `backend/src/types/health.ts` - typy dla health checks

**Endpoint `/api/v1/health/detailed` response:**
```json
{
  "overall": "healthy",
  "timestamp": "2026-01-02T19:16:00Z",
  "workers": {
    "eli": {
      "status": "running",
      "lastRun": "2026-01-02T19:15:52Z",
      "documentsToday": 45
    },
    "rss": {
      "status": "running",
      "lastRun": "2026-01-02T19:16:00Z",
      "documentsToday": 12
    },
    "nfz": {
      "status": "running",
      "lastRun": "2026-01-02T19:16:03Z",
      "documentsToday": 3
    }
  },
  "database": {
    "totalDocuments": 1245,
    "oldestDocument": "2025-08-05",
    "newestDocument": "2026-01-02"
  }
}
```

---

## 📊 Metryki (Obecny Stan vs Cel)

| Metryka | Obecny Stan | Cel v2.0 | Status |
|---------|-------------|----------|--------|
| **Architektura workerów** | Sekwencyjna (blokująca) | 3 niezależne workery | ✅ DONE |
| **Deduplikacja** | Brak (duplikaty ~15%) | Composite key + unique | ✅ DONE |
| **Historia danych** | 30-90 dni | 150 dni (bufor 90d+60d) | ✅ DONE |
| **Endpointy API** | 1 (`/updates`) | 4 (`/eli`, `/rss`, `/nfz`, `/updates`) | ✅ DONE |
| **Health checks** | Prosty (`/health`) | Szczegółowy (`/health/detailed`) | ✅ DONE |
| **Frontend - filtry źródeł** | Brak | Przełącznik All/ELI/RSS/NFZ | 🚧 TODO |
| **Frontend - status workerów** | Brak | Wskaźniki per źródło | 🚧 TODO |

---

## 🏃 Backend - Live Status

**Porty:**
- Backend HTTP: http://localhost:5554 ✅ RUNNING
- Frontend Vite: http://localhost:5555 ✅ RUNNING
- Swagger UI: http://localhost:5554/api/docs ✅ ACTIVE

**Workery (aktywne od 19:15:52):**
- 🇪🇺 ELI Worker: ✅ RUNNING (cycle: 10 min, next: ~19:26)
- 📡 RSS Worker: ✅ RUNNING (cycle: 15 min, next: ~19:31)
- 🏥 NFZ Worker: ✅ RUNNING (cycle: 20 min, next: ~19:36)

**Baza danych:**
- Plik: `backend/dev.db` (SQLite)
- Rekordy: ~943 (przed refaktoryzacją)
- Migracja: `20260102181439_add_composite_fields_step1` ✅
- Backup: `legal.db.backup-20260102-HHMMSS` ✅

---

## 🧪 Testowanie

### Backend API (curl)
```bash
# Health check
curl http://localhost:5554/api/v1/health

# Detailed health check
curl http://localhost:5554/api/v1/health/detailed

# Wszystkie dokumenty (90 dni)
curl "http://localhost:5554/api/v1/updates?range=90d"

# Tylko ELI (Sejm DU)
curl "http://localhost:5554/api/v1/updates/eli?range=90d&source=eli-sejm-du"

# Tylko RSS
curl "http://localhost:5554/api/v1/updates/rss?range=30d"

# Tylko NFZ
curl "http://localhost:5554/api/v1/updates/nfz?range=90d"
```

### Frontend (http://localhost:5555)
- ✅ Strona ładuje się
- ⚠️ Przycisk "Pobierz dane" - działa z starym endpointem `/updates`
- 🚧 Przełącznik źródeł - DO IMPLEMENTACJI
- 🚧 Wskaźniki statusu workerów - DO IMPLEMENTACJI

---

## 📝 Next Steps (Priorytetyzacja)

### 1. Implementuj Frontend Source Selector (60 min) 🔴 PRIORYTET 1
   - Dodaj przełącznik All/ELI/RSS/NFZ w `App.tsx`
   - Zaktualizuj `apiService.ts` z nowymi funkcjami
   - Stwórz `SourceSelector.tsx` komponent

### 2. Dodaj Source Health Indicators (30 min) 🟡 PRIORYTET 2
   - Pobieraj `/health/detailed` co 30s
   - Wyświetl zielone/czerwone kropki per worker
   - Pokaż "documentsToday" per źródło

### 3. Usuń stare pole `id` z bazy (15 min) ⚪ OPCJONALNE
   - Druga migracja Prisma: usuń `id`, zmień `compositeKey` na `@id`
   - Dodaj `@@unique([sourceId, docId, date])`
   - UWAGA: Backend już używa compositeKey, więc to bezpieczne

### 4. Zaktualizuj testy E2E (45 min) ⚪ OPCJONALNE
   - `tests/e2e/source-filter.spec.ts` - testuj przełącznik
   - `tests/e2e/health-status.spec.ts` - testuj wskaźniki
   - Zaktualizuj `eval/queries.jsonl` z nowymi endpointami

---

## 🐛 Znane Problemy

1. **Stare pole `id` w bazie** - Jeszcze nie usunięte (backward compatibility)
   - **Fix:** Druga migracja Prisma po przetestowaniu
   
2. **Frontend używa starych endpointów** - Brak przełącznika źródeł
   - **Fix:** Implementuj Fazę 5 (SourceSelector + nowe funkcje API)

3. **Duplikaty w starej bazie** - ~15% duplikatów z przed migracji
   - **Fix:** Workery już używają deduplikacji, stare duplikaty zostaną z czasem nadpisane przez upsert

---

## 📚 Dokumentacja

- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) - Pełna analiza systemu
- [backend/README.md](backend/README.md) - Dokumentacja backendu
- [FRONTEND_DOCUMENTATION.md](FRONTEND_DOCUMENTATION.md) - 🚧 TODO
- [.github/prompts/plan-frontendRewrite.prompt.md](.github/prompts/plan-frontendRewrite.prompt.md) - Plan frontendu

---

**Ostatnia aktualizacja:** 2026-01-02 19:16:00  
**Status:** Backend ✅ DONE (Fazy 1-4) | Frontend 🚧 IN PROGRESS (Faza 5)
