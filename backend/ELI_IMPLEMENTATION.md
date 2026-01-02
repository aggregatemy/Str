# Implementacja Standardu ELI w Polsce

## Standard ELI (European Legislation Identifier)

ELI to europejski standard identyfikacji i opisywania aktów prawnych za pomocą URI oraz metadanych RDF.

### Polskie źródła ELI

System integruje następujące źródła:

| Instytucja | Priorytet | Endpoint | Status |
|------------|-----------|----------|--------|
| Sejm RP (ISAP) | 1 | https://isap.sejm.gov.pl/api/eli/acts | ✅ Aktywne |
| Dziennik Ustaw | 1 | https://dziennikustaw.gov.pl/api/eli | ✅ Aktywne |
| RCL | 1 | https://legislacja.rcl.gov.pl/api/eli | ✅ Aktywne |
| Monitor Polski | 2 | https://monitorpolski.gov.pl/api/eli | ✅ Aktywne |
| Min. Zdrowia | 2 | https://www.gov.pl/api/eli/mz | ⚠️ Do weryfikacji |
| Min. Finansów | 2 | https://www.gov.pl/api/eli/mf | ⚠️ Do weryfikacji |
| Min. Edukacji | 2 | https://www.gov.pl/api/eli/me | ⚠️ Do weryfikacji |
| GUS | 3 | https://api.stat.gov.pl/eli | ✅ Aktywne |
| URPL | 3 | https://urpl.gov.pl/api/eli | ⚠️ Do weryfikacji |
| UOKiK | 3 | https://www.uokik.gov.pl/api/eli | ⚠️ Do weryfikacji |

### Architektura systemu

System ELI składa się z następujących komponentów:

#### 1. Konfiguracja źródeł (`config/eliSources.ts`)
Centralna konfiguracja wszystkich źródeł ELI z priorytetami, formatami i statusami.

#### 2. Parser ELI (`scrapers/eli/eliParser.ts`)
Uniwersalny parser obsługujący różne formaty:
- ✅ JSON-LD (domyślny i najczęstszy w Polsce)
- ⚠️ RDF/XML (do implementacji w razie potrzeby)
- ⚠️ Turtle (do implementacji w razie potrzeby)

#### 3. Klient ELI (`scrapers/eli/eliClient.ts`)
Uniwersalny klient HTTP dla endpointów ELI z obsługą:
- Timeoutów (30s)
- Nagłówków Accept
- Parametrów zapytań (limity, filtry dat)
- Obsługi błędów

#### 4. Główny scraper (`scrapers/eliScraper.ts`)
Orchestrator agregujący dane ze wszystkich źródeł:
- Pobieranie równoległe (max 3 źródła jednocześnie)
- Obsługa błędów dla niedostępnych źródeł
- Agregacja wyników

### Dodawanie nowych źródeł

Aby dodać nowe źródło ELI, edytuj `backend/src/config/eliSources.ts`:

```typescript
{
  id: 'nowe-zrodlo',
  name: 'Nazwa instytucji',
  institution: 'Pełna nazwa',
  baseUrl: 'https://example.gov.pl',
  apiEndpoint: 'https://example.gov.pl/api/eli',
  format: 'json-ld',
  active: true,
  priority: 3,
  category: 'Kategoria',
  description: 'Opis'
}
```

### Ontologia ELI

Pełna specyfikacja: https://eur-lex.europa.eu/eli-register/about.html

Kluczowe pola obsługiwane przez parser:

| Pole ELI | Opis | Mapowanie do LegalFact |
|----------|------|------------------------|
| `@id` | Identyfikator URI | `eliUri` |
| `eli:title` | Tytuł aktu | `title` |
| `eli:title_short` | Tytuł skrócony | `title` (fallback) |
| `eli:description` | Opis/streszczenie | `summary`, `officialRationale` |
| `eli:date_publication` | Data publikacji | `date` |
| `eli:date_document` | Data dokumentu | `date` (fallback) |
| `eli:type_document` | Typ dokumentu | `category`, `impact` |
| `eli:is_about` | Tematyka | `category` |
| `eli:in_force` | Status obowiązywania | `legalStatus` |

### Określanie wpływu (impact)

System automatycznie określa wpływ aktu prawnego na podstawie typu:

- **HIGH**: ustawa, konstytucja, act, constitution
- **MEDIUM**: rozporządzenie, decree, regulation
- **LOW**: inne dokumenty

### Obsługa błędów

System jest odporny na błędy pojedynczych źródeł:
- Timeout (30s) dla każdego źródła
- Logowanie błędów HTTP
- Kontynuacja działania przy niedostępności źródła
- Zwracanie pustej tablicy w przypadku błędu

### Testowanie

Aby przetestować system:

```bash
cd backend
npm run dev
```

System automatycznie pobierze dane ze wszystkich aktywnych źródeł przy starcie.

### Monitorowanie

Logi zawierają informacje o:
- Liczbie pobranych dokumentów z każdego źródła
- Błędach połączeń
- Timeoutach
- Łącznej liczbie pobranych dokumentów

Przykładowy output:
```
🇪🇺 Uruchamianie scraperów ELI dla 9 źródeł...
📡 ELI: Pobieranie z Sejm RP - Internetowy System Aktów Prawnych...
✅ Sejm RP - Internetowy System Aktów Prawnych: 45 dokumentów
📡 ELI: Pobieranie z Dziennik Ustaw RP...
❌ HTTP 404: Dziennik Ustaw RP
✅ ELI: Pobrano łącznie 45 dokumentów
```

### Uwagi techniczne

1. **Weryfikacja URL**: Wiele endpointów może wymagać weryfikacji - nie wszystkie instytucje mają publicznie dostępne API ELI.

2. **Rate Limiting**: System pobiera maksymalnie 3 źródła równolegle, aby nie przeciążać serwerów.

3. **Autentykacja**: Obecnie brak obsługi autentykacji. W razie potrzeby można dodać API keys w konfiguracji źródeł.

4. **Cache**: System wykorzystuje cache na poziomie `dataService`.

5. **Backward Compatibility**: Zachowano funkcję `scrapeELI()` dla kompatybilności wstecznej (pobiera tylko dane z Sejmu).

### Rozszerzanie parsera

Jeśli pojawi się potrzeba obsługi RDF/XML lub Turtle:

1. Zainstaluj odpowiednią bibliotekę (np. `rdflib.js`)
2. Zaimplementuj metody w `eliParser.ts`:
   - `parseRdfXml()`
   - `parseTurtle()`

### Status implementacji

- ✅ Konfiguracja źródeł
- ✅ Parser JSON-LD
- ✅ Klient HTTP
- ✅ Agregator wieloźródłowy
- ✅ Integracja z dataService
- ✅ Obsługa błędów
- ✅ Dokumentacja
- ⚠️ Parser RDF/XML (opcjonalny)
- ⚠️ Parser Turtle (opcjonalny)
- ⚠️ Autentykacja API (jeśli potrzebna)

### Kontakt i wsparcie

W przypadku problemów z konkretnymi źródłami:
1. Sprawdź status źródła w `eliSources.ts`
2. Zweryfikuj dostępność endpointu w przeglądarce
3. Ustaw `active: false` dla niedostępnych źródeł
4. Zgłoś problem do administratora źródła
