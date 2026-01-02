# Plan Implementacji - Strażnik Prawa (Dopracowanie)

## 🎯 Cel: Pełna Funkcjonalność + Wydajność + Estetyka

**Data**: 2026-01-02  
**Status**: Backend ✅ działający, Frontend ✅ renderujący, **Wymaga dopracowania**

---

## ✅ Co Jest Już Gotowe

### Backend (100% functional)
- [x] Express server na porcie 5554
- [x] 10 źródeł danych (ELI + RSS + Scraper)
- [x] **120+ dni historii** dokumentów (wymaganie spełnione!)
- [x] Scheduler co 10 minut
- [x] Prisma + SQLite persistence
- [x] API endpoints: `/health`, `/updates`, `/export/extract`
- [x] Swagger UI documentation
- [x] 17/17 unit testów ✅

### Frontend (90% functional)
- [x] Vite dev server na porcie 5555
- [x] **Brak Import Map** - poprawna konfiguracja ✅
- [x] Filtry czasowe 7d / 30d / 90d
- [x] 3 widoki (Główny / Archiwum / Źródła)
- [x] Zaznaczanie i export dokumentów
- [x] LocalStorage persistence
- [x] Error handling (3 typy błędów)
- [x] 21/21 unit testów ✅

### Testy
- [x] Backend: 17/17 unit (100%)
- [x] Frontend: 21/21 unit (100%)
- [ ] E2E: 2/6 passing (timeouty - do naprawy)

---

## 🚀 Plan Dopracowania (Priorytetyzowany)

### ⚡ FAZA 1: Stabilizacja E2E Testów (45 min) - **WYSOKI PRIORYTET**

**Problem**: Testy Playwright timeoutują bo czekają na dane z backendu.

**Rozwiązanie**:

#### 1.1 Dodaj helper funkcję wait-for-data (15 min)

**Plik**: `tests/e2e/helpers.ts` (NOWY)

```typescript
/**
 * Czeka aż backend wypełni bazę danymi (max 60s)
 */
export async function waitForBackendData(maxWaitMs = 60000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch('http://localhost:5554/api/v1/updates');
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`✅ Backend gotowy: ${data.length} dokumentów w bazie`);
          return;
        }
      }
    } catch {}
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Sprawdź co 5s
  }
  
  throw new Error('Backend nie zwrócił danych w ciągu 60s');
}

/**
 * Sprawdź czy backend działa (health check)
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:5554/api/v1/health');
    return response.ok;
  } catch {
    return false;
  }
}
```

#### 1.2 Zaktualizuj E2E testy (20 min)

**Plik**: `tests/e2e/app.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForBackendData, checkBackendHealth } from './helpers';

test.describe('Strażnik Prawa - Frontend E2E Tests', () => {
  
  test.beforeAll(async () => {
    // Sprawdź czy backend działa
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      throw new Error('Backend nie odpowiada na http://localhost:5554/api/v1/health');
    }
    
    // Poczekaj na dane w bazie (max 60s)
    await waitForBackendData();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5555');
    // Poczekaj na hydration React
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('wyświetla tytuł aplikacji', async ({ page }) => {
    const title = await page.textContent('h1');
    expect(title).toContain('Repozytorium Aktów');
  });

  test('pokazuje przycisk "Pobierz dane"', async ({ page }) => {
    // Zmień na faktyczny selektor przycisku filtra
    await expect(page.locator('text=7 dni')).toBeVisible();
  });

  test('wyświetla listę dokumentów po pobraniu danych', async ({ page }) => {
    // Kliknij filtr 7 dni (triggeruje reload danych)
    await page.click('text=7 dni');
    
    // Poczekaj max 10s na pojawienie się dokumentów
    await page.waitForSelector('[data-testid="update-card"]', { timeout: 10000 });
    
    // Sprawdź czy są dokumenty
    const cards = page.locator('[data-testid="update-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('można wybrać dokument klikając na checkbox', async ({ page }) => {
    await page.click('text=7 dni');
    await page.waitForSelector('[data-testid="update-card"]', { timeout: 10000 });
    
    // Znajdź pierwszy checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    // Sprawdź czy jest zaznaczony
    await expect(firstCheckbox).toBeChecked();
    
    // Sprawdź czy pojawił się floating button
    await expect(page.locator('text=Wygeneruj Wyciąg Faktograficzny')).toBeVisible();
  });

  test('można eksportować wybrane dokumenty', async ({ page }) => {
    await page.click('text=7 dni');
    await page.waitForSelector('[data-testid="update-card"]', { timeout: 10000 });
    
    // Zaznacz pierwszy dokument
    await page.locator('input[type="checkbox"]').first().check();
    
    // Kliknij przycisk eksportu
    await page.click('text=Wygeneruj Wyciąg Faktograficzny');
    
    // Poczekaj na modal (max 20s - backend generuje raport)
    await page.waitForSelector('[data-testid="export-modal"]', { timeout: 20000 });
    
    // Sprawdź czy modal zawiera treść
    const modalContent = await page.textContent('[data-testid="export-modal"]');
    expect(modalContent).toBeTruthy();
    expect(modalContent!.length).toBeGreaterThan(0);
  });

  test('filtry czasowe działają poprawnie', async ({ page }) => {
    // Test 7 dni
    await page.click('text=7 dni');
    await page.waitForSelector('[data-testid="update-card"]', { timeout: 10000 });
    const count7d = await page.locator('[data-testid="update-card"]').count();
    
    // Test 30 dni
    await page.click('text=30 dni');
    await page.waitForTimeout(2000); // API request
    const count30d = await page.locator('[data-testid="update-card"]').count();
    
    // Test 90 dni
    await page.click('text=90 dni');
    await page.waitForTimeout(2000); // API request
    const count90d = await page.locator('[data-testid="update-card"]').count();
    
    // Sprawdź hierarchię: 7d <= 30d <= 90d
    expect(count7d).toBeLessThanOrEqual(count30d);
    expect(count30d).toBeLessThanOrEqual(count90d);
  });
});
```

#### 1.3 Dodaj data-testid do komponentów (10 min)

**Plik**: `components/UpdateCard.tsx`

```tsx
// Zmień:
<div className="bg-white border...">

// Na:
<div data-testid="update-card" className="bg-white border...">
```

**Plik**: `App.tsx` (modal eksportu)

```tsx
// Zmień:
<div className="fixed inset-0 z-[100]...">

// Na:
<div data-testid="export-modal" className="fixed inset-0 z-[100]...">
```

---

### 🎨 FAZA 2: UI/UX Dopracowanie (60 min) - **WYSOKI PRIORYTET**

**Cel**: Ładniejszy i szybszy interfejs

#### 2.1 Loading Skeleton dla dokumentów (20 min)

**Plik**: `components/UpdateCardSkeleton.tsx` (NOWY)

```tsx
export function UpdateCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 bg-slate-200 rounded"></div>
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          
          {/* Meta info */}
          <div className="flex gap-2">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
          
          {/* Summary */}
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Użycie w App.tsx**:

```tsx
{laduje ? (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => <UpdateCardSkeleton key={i} />)}
  </div>
) : (
  <UpdateCard ... />
)}
```

#### 2.2 Animacje Tailwind (15 min)

**Plik**: `tailwind.config.js` (jeśli nie istnieje, dodaj inline w `index.html`)

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in',
          'slide-up': 'slideUp 0.4s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(20px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          }
        }
      }
    }
  }
</script>
```

**Użycie**:

```tsx
// Modal eksportu
<div className="animate-fade-in fixed inset-0...">

// Karty dokumentów
<div className="animate-slide-up bg-white border...">

// Floating button
<div className="animate-slide-up fixed bottom-10...">
```

#### 2.3 Indicator stanu źródeł (25 min)

**Plik**: `components/SourceStatus.tsx` (NOWY)

```tsx
interface SourceStatusProps {
  totalSources: number;
  activeSources: number;
  lastUpdate: Date | null;
  isRefreshing: boolean;
}

export function SourceStatus({ totalSources, activeSources, lastUpdate, isRefreshing }: SourceStatusProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-100 rounded text-[9px]">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className="font-bold text-slate-700">
          {activeSources}/{totalSources} źródeł aktywnych
        </span>
      </div>
      
      {/* Last update */}
      {lastUpdate && (
        <div className="text-slate-400">
          Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString('pl-PL')}
        </div>
      )}
      
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center gap-2 text-yellow-600">
          <i className="fas fa-sync-alt animate-spin"></i>
          <span>Aktualizacja...</span>
        </div>
      )}
    </div>
  );
}
```

**Dodaj w App.tsx** (pod headerem):

```tsx
<SourceStatus 
  totalSources={10}
  activeSources={config.masterSites.filter(s => s.isActive).length}
  lastUpdate={lastUpdateTime}
  isRefreshing={laduje}
/>
```

---

### 📊 FAZA 3: Backend Monitoring Dashboard (45 min) - **ŚREDNI PRIORYTET**

**Cel**: Rozszerzyć `/api/v1/health` o statystyki

#### 3.1 Backend health endpoint upgrade (20 min)

**Plik**: `backend/src/routes/api.ts`

```typescript
router.get('/health', async (req, res) => {
  try {
    const stats = await prisma.legalFact.groupBy({
      by: ['ingestMethod'],
      _count: true
    });
    
    const totalDocs = await prisma.legalFact.count();
    
    const last7Days = await prisma.legalFact.count({
      where: {
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      }
    });
    
    const last30Days = await prisma.legalFact.count({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      }
    });
    
    const last90Days = await prisma.legalFact.count({
      where: {
        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      }
    });
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        totalDocuments: totalDocs,
        byMethod: stats.reduce((acc, s) => ({ ...acc, [s.ingestMethod]: s._count }), {}),
        coverage: {
          last7Days,
          last30Days,
          last90Days
        }
      },
      sources: {
        total: 10,
        active: 10 // TODO: dynamic check
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

#### 3.2 Frontend health display (25 min)

**Plik**: `components/HealthDashboard.tsx` (NOWY)

```tsx
import { useEffect, useState } from 'react';

interface HealthData {
  status: string;
  timestamp: string;
  database: {
    totalDocuments: number;
    byMethod: Record<string, number>;
    coverage: {
      last7Days: number;
      last30Days: number;
      last90Days: number;
    };
  };
  sources: {
    total: number;
    active: number;
  };
}

export function HealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  
  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch('/api/v1/health');
        const data = await response.json();
        setHealth(data);
      } catch {}
    }
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Co 1 min
    return () => clearInterval(interval);
  }, []);
  
  if (!health) return null;
  
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Total documents */}
      <div className="bg-white border border-slate-200 p-6">
        <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Łącznie dokumentów</div>
        <div className="text-3xl font-black text-slate-900">{health.database.totalDocuments}</div>
        <div className="text-[8px] text-slate-400 mt-2">W bazie SQLite</div>
      </div>
      
      {/* Coverage 90d */}
      <div className="bg-white border border-slate-200 p-6">
        <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Pokrycie 90 dni</div>
        <div className="text-3xl font-black text-slate-900">{health.database.coverage.last90Days}</div>
        <div className="text-[8px] text-slate-400 mt-2">
          7d: {health.database.coverage.last7Days} | 30d: {health.database.coverage.last30Days}
        </div>
      </div>
      
      {/* By method */}
      <div className="bg-white border border-slate-200 p-6">
        <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Metoda ingestii</div>
        <div className="space-y-1">
          {Object.entries(health.database.byMethod).map(([method, count]) => (
            <div key={method} className="flex justify-between text-[10px]">
              <span className="text-slate-600 uppercase">{method}:</span>
              <span className="font-bold text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Dodaj w App.tsx** (widok "Parametry API"):

```tsx
{widok === 'zrodla' && (
  <>
    <HealthDashboard />
    <div className="bg-white border border-slate-200 p-10 space-y-8">
      {/* Existing sources config */}
    </div>
  </>
)}
```

---

### 🔍 FAZA 4: Search i Filtering (60 min) - **ŚREDNI PRIORYTET**

**Cel**: Wyszukiwanie w tytułach i filtrowanie po źródłach

#### 4.1 Search input (20 min)

**Plik**: `components/SearchBar.tsx` (NOWY)

```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Szukaj w tytułach...' }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 border border-slate-200 rounded 
                   text-[11px] text-slate-900 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
      
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
}
```

#### 4.2 Source filter (20 min)

**Plik**: `components/SourceFilter.tsx` (NOWY)

```tsx
interface SourceFilterProps {
  sources: { id: string; name: string; type: string }[];
  selectedSources: string[];
  onToggle: (id: string) => void;
}

export function SourceFilter({ sources, selectedSources, onToggle }: SourceFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map(source => (
        <button
          key={source.id}
          onClick={() => onToggle(source.id)}
          className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all
                      ${selectedSources.includes(source.id)
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {source.type === 'eli' && <i className="fas fa-balance-scale mr-1"></i>}
          {source.type === 'rss' && <i className="fas fa-rss mr-1"></i>}
          {source.type === 'scraper' && <i className="fas fa-spider mr-1"></i>}
          {source.name}
        </button>
      ))}
    </div>
  );
}
```

#### 4.3 Integracja w App.tsx (20 min)

```tsx
// Dodaj state
const [searchQuery, setSearchQuery] = useState('');
const [selectedSources, setSelectedSources] = useState<string[]>(
  config.masterSites.map(s => s.id)
);

// Aktualizuj filtrowanie
const filtrowaneZmiany = useMemo(() => {
  let filtered = widok === 'archiwum' ? zapisane : zmiany;
  
  // Search filter
  if (searchQuery) {
    filtered = filtered.filter(u =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Source filter
  filtered = filtered.filter(u => {
    const sourceId = u.id.split('-')[0]; // Ekstraktuj 'eli-sejm-du' -> 'eli-sejm-du'
    return selectedSources.some(s => u.id.startsWith(s));
  });
  
  return filtered;
}, [widok, zapisane, zmiany, searchQuery, selectedSources]);

// Dodaj w UI (przed UpdateCard)
{widok === 'glowny' && (
  <div className="space-y-4 mb-8">
    <SearchBar value={searchQuery} onChange={setSearchQuery} />
    <SourceFilter 
      sources={config.masterSites}
      selectedSources={selectedSources}
      onToggle={(id) => setSelectedSources(prev => 
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      )}
    />
  </div>
)}
```

---

### ⚡ FAZA 5: Performance Optimization (30 min) - **NISKI PRIORYTET**

**Cel**: Lazy loading i code splitting

#### 5.1 React.lazy dla modalu (15 min)

```tsx
// Przed:
{raportOtwarty && (
  <div className="fixed inset-0...">
    {/* Modal content */}
  </div>
)}

// Po:
const ExportModal = React.lazy(() => import('./components/ExportModal'));

{raportOtwarty && (
  <React.Suspense fallback={<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"><div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>}>
    <ExportModal 
      isOpen={raportOtwarty}
      content={trescRaportu}
      isGenerating={generujeRaport}
      onClose={() => setRaportOtwarty(false)}
    />
  </React.Suspense>
)}
```

#### 5.2 Virtualizacja listy dokumentów (15 min)

**Instalacja**:
```bash
npm install @tanstack/react-virtual
```

**Użycie**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// W komponencie UpdateCard
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: updates.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200, // Średnia wysokość karty
});

return (
  <div ref={parentRef} className="h-[800px] overflow-auto">
    <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <div
          key={virtualItem.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          <SingleUpdate update={updates[virtualItem.index]} />
        </div>
      ))}
    </div>
  </div>
);
```

---

## 📊 Metryki Sukcesu Końcowego

### Funkcjonalność (Target: 100%)
- [x] Backend pobiera 120+ dni (✅ spełnione)
- [x] Frontend ma filtry 7d/30d/90d (✅ spełnione)
- [x] 10 źródeł danych aktywnych (✅ spełnione)
- [ ] E2E testy 6/6 passing (2/6 obecnie)
- [ ] Search i filtering (opcjonalne)
- [ ] Health dashboard (opcjonalne)

### Wydajność (Target: <2s)
- [x] Backend start: <5s ✅
- [x] Initial data ingest: <60s ✅
- [x] API response: <500ms ✅
- [x] Frontend load: <2s ✅
- [ ] Virtualizacja dla >100 dokumentów (opcjonalne)

### Estetyka (Target: Modern UI)
- [x] Clean design (Tailwind) ✅
- [x] Responsive (podstawowo) ✅
- [ ] Loading skeletons (nice-to-have)
- [ ] Smooth animations (nice-to-have)
- [ ] Dark mode (opcjonalne)

### Testy (Target: 90%)
- [x] Backend unit: 17/17 (100%) ✅
- [x] Frontend unit: 21/21 (100%) ✅
- [ ] E2E: 6/6 (33% obecnie - do naprawy)

---

## 🎯 Harmonogram Implementacji

| Faza | Czas | Priorytet | Status |
|------|------|-----------|--------|
| **FAZA 1** - E2E Tests | 45 min | 🔴 WYSOKI | ⏳ Oczekuje |
| **FAZA 2** - UI/UX | 60 min | 🔴 WYSOKI | ⏳ Oczekuje |
| **FAZA 3** - Monitoring | 45 min | 🟡 ŚREDNI | ⏳ Oczekuje |
| **FAZA 4** - Search | 60 min | 🟡 ŚREDNI | ⏳ Oczekuje |
| **FAZA 5** - Performance | 30 min | 🟢 NISKI | ⏳ Oczekuje |
| **RAZEM** | **4h 00min** | | |

---

## 🚀 Jak Uruchomić (Quick Start)

### 1. Terminal 1 - Backend
```powershell
cd C:\Dev\Str\backend
npm run dev
```

**Oczekiwany output**:
```
✅ Backend HTTP działa na http://localhost:5554
📅 Scheduler uruchomiony (co 10 min)
🔄 Odświeżanie danych z wszystkich źródeł...
✅ SUKCES: Zapisano X rekordów do SQLite
```

### 2. Terminal 2 - Frontend
```powershell
cd C:\Dev\Str
npm run dev
```

**Oczekiwany output**:
```
VITE v6.4.1  ready in 451 ms
➜  Local:   http://localhost:5555/
```

### 3. Weryfikacja
1. Otwórz http://localhost:5555
2. Poczekaj ~30s na pierwszą ingestię danych
3. Kliknij "7 dni" - powinny wyświetlić się dokumenty ✅
4. Kliknij "30 dni" - więcej dokumentów ✅
5. Kliknij "90 dni" - jeszcze więcej (wymaga 120 dni w bazie) ✅

---

## ✅ Podsumowanie Zmian (2026-01-02)

### Backend ✅
1. **120 dni historii** (było 30) - ELI Client, Sejm API Scraper
2. **Zwiększone limity pozycji**:
   - Sejm: 1-150 (było 1-100)
   - Ministerstwa: 1-80 (było 1-50)
3. **Scheduler 10 min** (było 1 min) - mniej obciążenie
4. **Dokumentacja**: FRONTEND_DOCUMENTATION.md

### Frontend ✅
1. **Brak Import Map** - Vite poprawnie bundluje React
2. **Filtry 7d/30d/90d** - w pełni funkcjonalne
3. **3 widoki** - Główny / Archiwum / Źródła
4. **Export dokumentów** - raport tekstowy
5. **Error handling** - 3 typy błędów + retry logic

### Do Zrobienia 🔜
1. **E2E testy** - wait-for-data helper (45 min)
2. **Loading skeletons** - lepsze UX (60 min)
3. **Health dashboard** - statystyki backendu (45 min)
4. **Search** - wyszukiwanie w tytułach (60 min)

---

**Ostatnia aktualizacja**: 2026-01-02 18:20 CET  
**Status**: ✅ **SYSTEM GOTOWY DO UŻYTKU** (opcjonalne ulepszenia w kolejnych fazach)
