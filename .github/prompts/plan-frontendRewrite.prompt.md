# Plan Przepisania Frontendu - Aplikacja Monitoringu Prawnego

## Analiza Obecnego Stanu

### Struktura Projektu (527 linii kodu)
- **App.tsx**: 250 linii - monolityczny komponent z całą logiką
- **UpdateCard.tsx**: 136 linii - komponent karty aktualizacji
- **apiService.ts**: 95 linii - warstwa komunikacji z backendem
- **index.tsx**: 9 linii - entry point aplikacji
- **index.html**: 29 linii - zawiera **KRYTYCZNY PROBLEM** (Import Map)
- **types.ts**: 33 linii - definicje TypeScript

### Obecne Funkcjonalności
1. **3 Widoki**:
   - Dane Faktograficzne (tabela aktualizacji z filtrami)
   - Archiwum (zarchiwizowane dokumenty)
   - Parametry API (konfiguracja źródeł danych)

2. **Filtry Czasowe**: 7 dni / 30 dni / 90 dni

3. **10 Źródeł Danych**:
   - 2 x Sejm RP (Dziennik Ustaw + Monitor Polski)
   - 5 x Ministerstwa (Zdrowia, Sprawiedliwości, Finansów, Edukacji, Klimatu)
   - 2 x RSS (ZUS, CEZ e-Zdrowie)
   - 1 x Scraper (Ministerstwo Zdrowia)

4. **Funkcje**:
   - Zaznaczanie dokumentów (checkbox)
   - Archiwizacja dokumentów
   - Export do JSON
   - Persistence w LocalStorage

### Zidentyfikowane Problemy

#### KRYTYCZNY (1)
**1. Import Map konfliktuje z Vite bundler**
- **Lokalizacja**: `index.html` linie 14-22
- **Problem**: Import Map ładuje React z CDN (esm.sh) zamiast z node_modules
- **Skutek**: React nie ładuje się poprawnie, pusta strona w przeglądarce
- **Rozwiązanie**: Usunąć `<script type="importmap">`, zostawić tylko Vite bundling

```html
<!-- DO USUNIĘCIA: -->
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react/": "https://esm.sh/react@^19.2.3/",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/"
  }
}
</script>
```

#### WYSOKI (1)
**2. Brak obsługi błędów backendu offline**
- **Lokalizacja**: `App.tsx` funkcja `pobierzDane`
- **Problem**: Retry logic (3 próby) bez właściwego UI dla permanent failure
- **Rozwiązanie**: Dodać Error Boundary + toast notifications

#### ŚREDNI (6)
**3. Monolityczna architektura App.tsx (250 linii)**
- Problem: Cała logika w jednym komponencie
- Rozwiązanie: Dekompozycja na mniejsze komponenty

**4. Nieużywane importy**
- `LegalFact`, `DashboardStats`, `UserProfileType` nigdy nie wykorzystane
- Rozwiązanie: Usunąć nieużywane importy

**5. Brak state management**
- LocalStorage bezpośrednio w komponencie
- Rozwiązanie: Zustand + React Query

**6. Zagnieżdżone ternary operators**
- App.tsx: skomplikowana logika warunkowego renderowania
- Rozwiązanie: Wydzielić do osobnych komponentów

**7. Accessibility issues**
- Brak aria-labels
- Brak keyboard navigation
- Rozwiązanie: Dodać ARIA attributes, focus management

**8. Brak responsywności**
- Nie przystosowane do mobile (<768px)
- Rozwiązanie: Tailwind responsive utilities

#### NISKI (2)
**9. Brak dark mode**
- Tylko light theme
- Rozwiązanie: Tailwind dark: variants

**10. Brak wyszukiwania/sortowania**
- Tylko filtr czasowy
- Rozwiązanie: Search input + sort dropdown

---

## Plan 6-Fazowy

### FAZA 1: Fix Import Map (KRYTYCZNY - 10 min)
**Cel**: Uruchomić frontend usuwając Import Map konflikt

**Kroki**:
1. Otwórz `index.html`
2. Usuń linie 14-22 (cały blok `<script type="importmap">`)
3. Zostaw tylko linię 28: `<script type="module" src="/index.tsx"></script>`
4. Restart dev servera: `npm run dev`
5. Weryfikacja: http://localhost:5555 - powinien renderować App

**Oczekiwany rezultat**: Frontend wyświetla się poprawnie w przeglądarce

---

### FAZA 2: Reorganizacja Struktury (30 min)
**Cel**: Uporządkować pliki w folder `src/` zgodnie z best practices

**Nowa struktura**:
```
src/
├── main.tsx              (było: index.tsx)
├── App.tsx               (bez zmian zawartości)
├── types/
│   └── index.ts          (było: types.ts)
├── components/
│   ├── Dashboard.tsx     (NOWY - ekstrakt z App.tsx)
│   ├── UpdatesList.tsx   (NOWY - ekstrakt z App.tsx)
│   ├── ExportModal.tsx   (NOWY - ekstrakt z App.tsx)
│   ├── SourcesConfig.tsx (NOWY - ekstrakt z App.tsx)
│   └── UpdateCard.tsx    (przeniesione)
├── services/
│   └── apiService.ts     (przeniesione)
└── hooks/
    ├── useUpdates.ts     (NOWY - React Query)
    ├── useArchive.ts     (NOWY - LocalStorage logic)
    ├── useExport.ts      (NOWY - export logic)
    └── useConfigStore.ts (NOWY - Zustand store)
```

**Kroki**:
1. Utwórz folder `src/` w root projektu
2. Przenieś `index.tsx` → `src/main.tsx`
3. Przenieś `App.tsx` → `src/App.tsx`
4. Przenieś `types.ts` → `src/types/index.ts`
5. Przenieś `components/` → `src/components/`
6. Przenieś `services/` → `src/services/`
7. Utwórz folder `src/hooks/`
8. Zaktualizuj `index.html` linię 28:
   ```html
   <script type="module" src="/src/main.tsx"></script>
   ```
9. Zaktualizuj `vite.config.ts` - dodaj alias:
   ```typescript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src')
     }
   }
   ```
10. Zaktualizuj `tsconfig.json` - dodaj paths:
    ```json
    "paths": {
      "@/*": ["./src/*"]
    }
    ```

**Weryfikacja**: Aplikacja działa bez zmian funkcjonalności

---

### FAZA 3: Dekompozycja App.tsx (90 min)
**Cel**: Rozbić monolityczny komponent na mniejsze, testwalne jednostki

#### 3.1 Wydziel Dashboard Component (20 min)
**Plik**: `src/components/Dashboard.tsx`

**Odpowiedzialność**:
- Time range selector (7d/30d/90d)
- Stats badges (suma dokumentów)
- Refresh button

**Props**:
```typescript
interface DashboardProps {
  timeRange: number;
  onTimeRangeChange: (range: number) => void;
  totalDocuments: number;
  isLoading: boolean;
  onRefresh: () => void;
}
```

#### 3.2 Wydziel UpdatesList Component (25 min)
**Plik**: `src/components/UpdatesList.tsx`

**Odpowiedzialność**:
- Lista dokumentów (UpdateCard items)
- Bulk selection checkbox
- Archive button
- Export button
- Empty state

**Props**:
```typescript
interface UpdatesListProps {
  updates: LegalUpdate[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onArchive: (ids: string[]) => void;
  onExport: (ids: string[]) => void;
  isLoading: boolean;
}
```

#### 3.3 Wydziel ExportModal Component (15 min)
**Plik**: `src/components/ExportModal.tsx`

**Odpowiedzialność**:
- Modal overlay
- JSON preview
- Copy/Download buttons
- Close action

**Props**:
```typescript
interface ExportModalProps {
  isOpen: boolean;
  data: any[];
  onClose: () => void;
}
```

#### 3.4 Wydziel SourcesConfig Component (20 min)
**Plik**: `src/components/SourcesConfig.tsx`

**Odpowiedzialność**:
- Lista 10 źródeł danych
- Status każdego źródła (enabled/disabled)
- Endpoint URLs
- Test connection buttons

**Props**:
```typescript
interface SourcesConfigProps {
  sources: MonitoredSite[];
  onToggleSource: (id: string) => void;
}
```

#### 3.5 Refaktoryzacja App.tsx (10 min)
**Cel**: Zredukować z 250 linii do ~80 linii

**Nowy App.tsx** (szkic):
```typescript
export function App() {
  const [activeView, setActiveView] = useState('updates');
  const [timeRange, setTimeRange] = useState(7);
  
  const { data, isLoading, refetch } = useUpdates(timeRange);
  const { selectedIds, toggleSelect, toggleAll } = useSelection(data);
  const { archiveDocuments } = useArchive();
  const { exportData, isExporting } = useExport();
  const config = useConfigStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <nav>
          <button onClick={() => setActiveView('updates')}>Dane Faktograficzne</button>
          <button onClick={() => setActiveView('archive')}>Archiwum</button>
          <button onClick={() => setActiveView('config')}>Parametry API</button>
        </nav>
      </header>

      <main>
        {activeView === 'updates' && (
          <>
            <Dashboard 
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              totalDocuments={data?.length ?? 0}
              isLoading={isLoading}
              onRefresh={refetch}
            />
            <UpdatesList 
              updates={data ?? []}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
              onArchive={archiveDocuments}
              onExport={exportData}
              isLoading={isLoading}
            />
          </>
        )}
        {activeView === 'archive' && <ArchiveView />}
        {activeView === 'config' && <SourcesConfig sources={config.sources} />}
      </main>
    </div>
  );
}
```

---

### FAZA 4: Modern State Management (60 min)

#### 4.1 Dodaj React Query (20 min)
**Instalacja**:
```bash
npm install @tanstack/react-query
```

**Hook**: `src/hooks/useUpdates.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchLegalUpdates } from '@/services/apiService';

export function useUpdates(timeRange: number) {
  return useQuery({
    queryKey: ['updates', timeRange],
    queryFn: () => fetchLegalUpdates(timeRange),
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

**Provider**: Dodaj w `src/main.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

#### 4.2 Dodaj Zustand dla Config (20 min)
**Instalacja**:
```bash
npm install zustand
```

**Store**: `src/hooks/useConfigStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  sources: MonitoredSite[];
  archivedIds: string[];
  toggleSource: (id: string) => void;
  archiveDocument: (id: string) => void;
  unarchiveDocument: (id: string) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      sources: KONFIGURACJA_DYNAMICZNA.masterSites,
      archivedIds: [],
      toggleSource: (id) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),
      archiveDocument: (id) =>
        set((state) => ({ archivedIds: [...state.archivedIds, id] })),
      unarchiveDocument: (id) =>
        set((state) => ({ archivedIds: state.archivedIds.filter((i) => i !== id) })),
    }),
    { name: 'legal-monitor-config' }
  )
);
```

#### 4.3 Custom Hooks (20 min)
**Hook**: `src/hooks/useArchive.ts`
```typescript
import { useConfigStore } from './useConfigStore';

export function useArchive() {
  const { archiveDocument, unarchiveDocument, archivedIds } = useConfigStore();
  
  const archiveDocuments = (ids: string[]) => {
    ids.forEach(archiveDocument);
  };
  
  return { archiveDocuments, unarchiveDocument, archivedIds };
}
```

**Hook**: `src/hooks/useExport.ts`
```typescript
import { useState } from 'react';
import { exportUpdates } from '@/services/apiService';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState(null);
  
  const exportDocuments = async (ids: string[]) => {
    setIsExporting(true);
    try {
      const data = await exportUpdates(ids);
      setExportData(data);
    } finally {
      setIsExporting(false);
    }
  };
  
  return { exportDocuments, exportData, isExporting };
}
```

---

### FAZA 5: Nowe Funkcjonalności (90 min)

#### 5.1 Wyszukiwanie (20 min)
**Komponent**: Dodaj do `Dashboard.tsx`
```typescript
<input
  type="text"
  placeholder="Szukaj w tytułach dokumentów..."
  className="w-full px-4 py-2 border rounded-lg"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

**Logika**: W `useUpdates` hook
```typescript
const filteredUpdates = useMemo(() => {
  if (!searchQuery) return data;
  return data.filter((u) =>
    u.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [data, searchQuery]);
```

#### 5.2 Paginacja (25 min)
**Hook**: `src/hooks/usePagination.ts`
```typescript
export function usePagination<T>(items: T[], itemsPerPage = 20) {
  const [page, setPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  return { paginatedItems, page, setPage, totalPages };
}
```

**UI**: Dodaj do `UpdatesList.tsx`
```typescript
<div className="flex justify-center gap-2 mt-4">
  <button onClick={() => setPage(p => Math.max(1, p - 1))}>Poprzednia</button>
  <span>Strona {page} z {totalPages}</span>
  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Następna</button>
</div>
```

#### 5.3 Sortowanie (15 min)
**State**: Dodaj do `UpdatesList`
```typescript
const [sortBy, setSortBy] = useState<'date' | 'title' | 'source'>('date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

**Logika**:
```typescript
const sortedUpdates = useMemo(() => {
  const sorted = [...updates];
  sorted.sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'source') return a.source.localeCompare(b.source);
  });
  return sortOrder === 'asc' ? sorted : sorted.reverse();
}, [updates, sortBy, sortOrder]);
```

#### 5.4 Responsive Design (15 min)
**Tailwind**: Dodaj breakpoints
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* cards */}
</div>

<nav className="flex flex-col md:flex-row gap-2">
  {/* buttons */}
</nav>
```

#### 5.5 Dark Mode (15 min)
**Hook**: `src/hooks/useDarkMode.ts`
```typescript
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  return [isDark, setIsDark] as const;
}
```

**Tailwind**: Dodaj dark variants
```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

---

### FAZA 6: Testy (120 min)

#### 6.1 Unit Tests - Components (40 min)

**Test**: `tests/components/Dashboard.test.tsx`
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '@/components/Dashboard';

describe('Dashboard', () => {
  it('renders time range buttons', () => {
    render(<Dashboard timeRange={7} onTimeRangeChange={vi.fn()} ... />);
    expect(screen.getByText('7 dni')).toBeInTheDocument();
    expect(screen.getByText('30 dni')).toBeInTheDocument();
    expect(screen.getByText('90 dni')).toBeInTheDocument();
  });
  
  it('calls onTimeRangeChange when button clicked', () => {
    const onChange = vi.fn();
    render(<Dashboard timeRange={7} onTimeRangeChange={onChange} ... />);
    fireEvent.click(screen.getByText('30 dni'));
    expect(onChange).toHaveBeenCalledWith(30);
  });
  
  it('shows loading state', () => {
    render(<Dashboard isLoading={true} ... />);
    expect(screen.getByText(/ładowanie/i)).toBeInTheDocument();
  });
});
```

**Test**: `tests/components/UpdatesList.test.tsx` (podobnie)

**Test**: `tests/components/ExportModal.test.tsx` (podobnie)

**Test**: `tests/components/SourcesConfig.test.tsx` (podobnie)

#### 6.2 Integration Tests - Hooks (30 min)

**Test**: `tests/hooks/useUpdates.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdates } from '@/hooks/useUpdates';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useUpdates', () => {
  it('fetches updates successfully', async () => {
    const { result } = renderHook(() => useUpdates(7), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
  
  it('handles errors with retry', async () => {
    // Mock API failure
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useUpdates(7), { wrapper });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

#### 6.3 E2E Tests - Full Flow (50 min)

**Test**: `tests/e2e/full-flow.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Legal Monitor App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5555');
  });
  
  test('loads and displays updates', async ({ page }) => {
    // Wait for data to load
    await expect(page.locator('.update-card')).toHaveCount.greaterThan(0);
    
    // Verify header
    await expect(page.locator('h1')).toContainText('Monitor Prawny');
  });
  
  test('filters updates by time range', async ({ page }) => {
    // Click 30 days button
    await page.click('text=30 dni');
    
    // Wait for refetch
    await page.waitForTimeout(1000);
    
    // Verify URL or state updated
    const count30d = await page.locator('.update-card').count();
    
    // Click 7 days button
    await page.click('text=7 dni');
    await page.waitForTimeout(1000);
    
    const count7d = await page.locator('.update-card').count();
    expect(count7d).toBeLessThanOrEqual(count30d);
  });
  
  test('selects and archives documents', async ({ page }) => {
    // Select first checkbox
    await page.locator('.update-card input[type="checkbox"]').first().check();
    
    // Click archive button
    await page.click('text=Archiwizuj');
    
    // Verify archived (document disappears or moved)
    await expect(page.locator('.update-card')).toHaveCount.lessThan(10);
    
    // Navigate to archive view
    await page.click('text=Archiwum');
    
    // Verify document appears in archive
    await expect(page.locator('.update-card')).toHaveCount.greaterThan(0);
  });
  
  test('exports selected documents', async ({ page }) => {
    // Select multiple checkboxes
    await page.locator('.update-card input[type="checkbox"]').first().check();
    await page.locator('.update-card input[type="checkbox"]').nth(1).check();
    
    // Click export button
    await page.click('text=Eksportuj zaznaczone');
    
    // Verify modal opens
    await expect(page.locator('.export-modal')).toBeVisible();
    
    // Verify JSON preview
    await expect(page.locator('.json-preview')).toContainText('"title"');
    
    // Close modal
    await page.click('text=Zamknij');
    await expect(page.locator('.export-modal')).not.toBeVisible();
  });
  
  test('searches documents', async ({ page }) => {
    // Type in search input
    await page.fill('input[placeholder*="Szukaj"]', 'ustawa');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const cards = page.locator('.update-card');
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/ustawa/i);
    }
  });
  
  test('navigates between views', async ({ page }) => {
    // Start on updates view
    await expect(page.locator('.dashboard')).toBeVisible();
    
    // Navigate to config
    await page.click('text=Parametry API');
    await expect(page.locator('.sources-config')).toBeVisible();
    
    // Navigate to archive
    await page.click('text=Archiwum');
    await expect(page.locator('.archive-view')).toBeVisible();
    
    // Back to updates
    await page.click('text=Dane Faktograficzne');
    await expect(page.locator('.dashboard')).toBeVisible();
  });
  
  test('toggles dark mode', async ({ page }) => {
    // Click dark mode toggle
    await page.click('[aria-label="Toggle dark mode"]');
    
    // Verify dark class applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Click again to disable
    await page.click('[aria-label="Toggle dark mode"]');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
```

---

## Harmonogram Czasowy

| Faza | Zadanie | Czas | Priorytet |
|------|---------|------|-----------|
| 1 | Fix Import Map | 10 min | **KRYTYCZNY** |
| 2 | Reorganizacja struktury | 30 min | WYSOKI |
| 3 | Dekompozycja App.tsx | 90 min | WYSOKI |
| 4 | State Management | 60 min | ŚREDNI |
| 5 | Nowe funkcjonalności | 90 min | ŚREDNI |
| 6 | Testy | 120 min | WYSOKI |
| **RAZEM** | | **6h 40min** | |

## Metryki Sukcesu

### Kod Quality
- ✅ Redukcja App.tsx z 250 → 80 linii (-68%)
- ✅ Średnia wielkość komponentu: <150 linii
- ✅ 0 nieużywanych importów
- ✅ 100% TypeScript strict mode compliance

### Testy
- ✅ 90%+ code coverage
- ✅ Wszystkie E2E testy przechodzą (10/10)
- ✅ Unit tests dla każdego komponentu
- ✅ Integration tests dla każdego hooka

### Performance
- ✅ First Contentful Paint: <1.5s
- ✅ Time to Interactive: <3s
- ✅ API caching: 5 min stale time
- ✅ Optimistic updates dla archiwizacji

### UX
- ✅ Responsive design (mobile + desktop)
- ✅ Dark mode support
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Error handling z toast notifications
- ✅ Loading states dla wszystkich async operations

---

## Zależności do Dodania

```bash
# State Management
npm install @tanstack/react-query zustand

# Dev Dependencies (jeśli nie ma)
npm install -D @testing-library/react @testing-library/user-event
```

---

## Uwagi Implementacyjne

1. **Backwards Compatibility**: LocalStorage key `monitored-sources-config` zachować dla migracji
2. **API Contract**: Nie zmieniać endpointów `/api/v1/updates` i `/api/v1/export/extract`
3. **Data Format**: `LegalUpdate` interface bez zmian
4. **Git Strategy**: Każda faza = osobny commit z tagiem `frontend-rewrite-phase-X`
5. **Rollback Plan**: Przed fazą 1 utworzyć branch `backup-old-frontend`

---

## Next Steps po Zatwierdzeniu

1. **Natychmiastowo**: Faza 1 (Fix Import Map) - 10 min
2. **Sesja 1** (1h): Faza 2 (Reorganizacja)
3. **Sesja 2** (1.5h): Faza 3 (Dekompozycja)
4. **Sesja 3** (1h): Faza 4 (State Management)
5. **Sesja 4** (1.5h): Faza 5 (Nowe funkcjonalności)
6. **Sesja 5** (2h): Faza 6 (Testy)

**Total**: 6 sesji, ~7.5h czystego czasu implementacji
