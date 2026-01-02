# Testy frontendu

## Uruchamianie testów

```bash
# Wszystkie testy
npm test

# Tryb watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# Z pokryciem kodu
npm run test:coverage

# UI Vitest (interfejs graficzny)
npm run test:ui
```

## Struktura testów

```
/home/runner/work/Str/Str/
├── src/
│   └── test/
│       └── setup.ts              # Konfiguracja środowiska testowego
├── components/
│   └── __tests__/
│       └── UpdateCard.test.tsx   # Testy komponentu UpdateCard
├── services/
│   └── __tests__/
│       └── apiService.test.ts    # Testy serwisu API
└── __tests__/
    ├── App.test.tsx               # Testy głównego komponentu aplikacji
    ├── types.test.ts              # Testy definicji typów TypeScript
    └── integration/
        └── full-flow.test.tsx     # Testy integracyjne (E2E-like)
```

## Narzędzia

- **Vitest** - szybki runner testów kompatybilny z Vite
- **React Testing Library** - testowanie komponentów React
- **happy-dom** - lekka symulacja środowiska DOM
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **@testing-library/jest-dom** - rozszerzone matchery dla DOM
- **c8** - narzędzie do generowania raportów pokrycia kodu

## Konfiguracja

### vitest.config.ts

Plik konfiguracyjny Vitest zawiera:
- Konfigurację pluginu React
- Ustawienia środowiska testowego (happy-dom)
- Plik setup dla testów
- Konfigurację pokrycia kodu z wykluczeniami

### src/test/setup.ts

Plik setup wykonywany przed każdym testem:
- Import matcharów z @testing-library/jest-dom
- Automatyczny cleanup po każdym teście
- Mock dla window.matchMedia

## Best practices

### 1. Testuj zachowanie, nie implementację

❌ **Źle:**
```typescript
expect(component.state.counter).toBe(5);
```

✅ **Dobrze:**
```typescript
expect(screen.getByText('Licznik: 5')).toBeInTheDocument();
```

### 2. Używaj `screen` queries zamiast `container`

❌ **Źle:**
```typescript
const { container } = render(<MyComponent />);
const button = container.querySelector('button');
```

✅ **Dobrze:**
```typescript
render(<MyComponent />);
const button = screen.getByRole('button');
```

### 3. Mockuj zewnętrzne zależności

```typescript
vi.mock('../services/apiService');

vi.mocked(apiService.fetchLegalUpdates).mockResolvedValue([...]);
```

### 4. Testy powinny być niezależne

Każdy test powinien działać samodzielnie, bez zależności od innych testów:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset stanu przed każdym testem
});
```

### 5. Cleanup automatyczny

Cleanup jest wykonywany automatycznie po każdym teście dzięki konfiguracji w `src/test/setup.ts`.

## Przykłady testów

### Test komponentu

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import MyComponent from './MyComponent';

it('powinien obsłużyć kliknięcie', () => {
  const handleClick = vi.fn();
  
  render(<MyComponent onClick={handleClick} />);
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Test asynchroniczny

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as api from './api';

vi.mock('./api');

it('powinien pobrać i wyświetlić dane', async () => {
  vi.mocked(api.fetchData).mockResolvedValue({ name: 'Test' });
  
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Test serwisu API

```typescript
import { vi } from 'vitest';
import { fetchData } from './apiService';

global.fetch = vi.fn();

it('powinien wywołać fetch z właściwym URL', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'test' })
  } as Response);
  
  await fetchData('123');
  
  expect(fetch).toHaveBeenCalledWith('/api/data/123');
});
```

### Test typów TypeScript

```typescript
import { expectTypeOf } from 'vitest';
import type { MyType } from './types';

it('MyType powinien mieć właściwe pola', () => {
  expectTypeOf<MyType>().toHaveProperty('id');
  expectTypeOf<MyType>().toHaveProperty('name');
});
```

## Pokrycie kodu

Uruchom testy z pokryciem:

```bash
npm run test:coverage
```

Raport zostanie wygenerowany w katalogu `coverage/`:
- `coverage/index.html` - raport HTML do przeglądania w przeglądarce
- `coverage/coverage-final.json` - surowe dane pokrycia

### Wyłączenia z pokrycia

Następujące pliki są wyłączone z raportów pokrycia:
- `node_modules/`
- `src/test/`
- `**/*.test.tsx`
- `**/*.test.ts`
- `vite.config.ts`
- `vitest.config.ts`

## Queries w React Testing Library

### Priorytety queries

1. **Accessible to everyone** (najlepsze):
   - `getByRole` - najpopularniejsze i najbardziej dostępne
   - `getByLabelText` - dla formularzy
   - `getByPlaceholderText` - dla inputów
   - `getByText` - dla tekstów niezwiązanych z formularzami

2. **Semantic queries**:
   - `getByAltText` - dla obrazków z tekstem alternatywnym
   - `getByTitle` - dla elementów z title

3. **Test IDs** (ostatnia deska ratunku):
   - `getByTestId` - tylko gdy inne metody nie są możliwe

### Warianty queries

- **getBy...** - rzuca błąd jeśli nie znajdzie elementu
- **queryBy...** - zwraca null jeśli nie znajdzie elementu
- **findBy...** - asynchroniczne, czeka na element

```typescript
// Synchroniczne - element musi istnieć
const button = screen.getByRole('button');

// Sprawdzenie czy element NIE istnieje
expect(screen.queryByText('Tekst')).not.toBeInTheDocument();

// Asynchroniczne - czeka na pojawienie się
const element = await screen.findByText('Załadowano');
```

## Mockowanie localStorage

```typescript
beforeEach(() => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  global.localStorage = localStorageMock as any;
});
```

## Debugowanie testów

### Wyświetl strukturę DOM

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Wyświetl cały DOM
screen.debug(screen.getByRole('button')); // Wyświetl konkretny element
```

### Logowanie queries

```typescript
screen.logTestingPlaygroundURL(); // Generuje URL do Testing Playground
```

### UI Vitest

Najlepszy sposób na debugowanie - uruchom:

```bash
npm run test:ui
```

Otwiera interfejs graficzny z:
- Listą wszystkich testów
- Podglądem kodu
- Możliwością uruchamiania pojedynczych testów
- Graficznym przedstawieniem wyników

## Częste problemy

### Problem: "Not wrapped in act(...)"

**Rozwiązanie:** Użyj `waitFor` dla operacji asynchronicznych:

```typescript
await waitFor(() => {
  expect(screen.getByText('Załadowano')).toBeInTheDocument();
});
```

### Problem: "Unable to find element"

**Rozwiązanie:** Sprawdź czy element jest rzeczywiście w DOM:

```typescript
screen.debug(); // Zobacz co jest w DOM
```

### Problem: Test przechodzi mimo błędu

**Rozwiązanie:** Upewnij się, że używasz `await` dla operacji asynchronicznych:

```typescript
// ❌ Źle
it('test', () => {
  fetchData(); // Brak await
  expect(...); // Wykonuje się przed zakończeniem fetchData
});

// ✅ Dobrze
it('test', async () => {
  await fetchData();
  expect(...);
});
```

## Continuous Integration

Testy są automatycznie uruchamiane w CI/CD pipeline. Upewnij się, że wszystkie testy przechodzą przed mergowaniem:

```bash
npm test
```

Jeśli testy nie przechodzą, pipeline zostanie zatrzymany.

## Dodawanie nowych testów

1. Utwórz plik z rozszerzeniem `.test.ts` lub `.test.tsx`
2. Umieść go w katalogu `__tests__` w odpowiedniej lokalizacji
3. Importuj funkcje testowe z vitest: `describe`, `it`, `expect`
4. Dla testów komponentów React użyj `@testing-library/react`
5. Uruchom testy: `npm test`

## Więcej informacji

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
