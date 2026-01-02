# Testy backendu

## Uruchamianie testów

```bash
# Wszystkie testy
npm test

# Tryb watch (dla developmentu)
npm run test:watch

# Z pokryciem kodu
npm run test:coverage

# Interfejs UI
npm run test:ui
```

## Struktura testów

- `src/scrapers/__tests__/` - testy scraperów
- `src/services/__tests__/` - testy serwisów
- `src/__tests__/` - testy integracyjne API

## Wymagania

- Pokrycie kodu: minimum 80%
- Wszystkie testy muszą przechodzić przed mergem
- Każdy nowy scraper musi mieć testy

## Mockowanie

Używamy `vi.mock()` z Vitest do mockowania:
- axios - dla testów HTTP
- scraperów - dla testów serwisów

## CI/CD

Testy uruchamiane automatycznie w GitHub Actions.
