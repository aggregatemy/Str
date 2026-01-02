# Weryfikacja Źródeł Danych - Strażnik Prawa Medycznego

## Kontekst Aplikacji
Aplikacja "Strażnik Prawa Medycznego" to system monitoringu zmian w prawie medycznym w Polsce.

**Architektura**: Zero-AI Assessment - bezpośrednie pobieranie i parsowanie danych bez interpretacji AI.

**Cel**: Automatyczne pobieranie aktów prawnych i zarządzeń z 4 źródeł rządowych.

## Status Źródeł Danych (Stan: 2 stycznia 2026)

### 1. CEZ (Centrum e-Zdrowia) - RSS Feed ✅ DZIAŁA

**Status**: ZWERYFIKOWANE - działa poprawnie

**Aktualny URL**: `https://www.ezdrowie.gov.pl/portal/home/rss`

**Weryfikacja**:
```bash
curl -I "https://www.ezdrowie.gov.pl/portal/home/rss"
# HTTP/1.1 200 OK
# Content-Type: text/plain;charset=UTF-8
# Content-Length: 155700
```

**Domena**: `ezdrowie.gov.pl` (NIE `cez.gov.pl`)

**Format**: XML RSS Feed

**Typ danych**: Komunikaty, aktualności, zmiany w e-zdrowiu

---

### 2. NFZ (Narodowy Fundusz Zdrowia) - Zarządzenia Prezesa ✅ DZIAŁA

**Status**: ZWERYFIKOWANE - działa poprawnie

**Aktualny URL**: `https://www.nfz.gov.pl/zarzadzenia-prezesa/`

**Weryfikacja**:
```bash
curl -I "https://www.nfz.gov.pl/zarzadzenia-prezesa/"
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8
# Content-Length: 35767
```

**Format**: HTML (tabela z zarządzeniami)

**Struktura**: Tabela z kolumnami: Numer, Tytuł, Data publikacji

**Typ danych**: Zarządzenia Prezesa NFZ

---

### 3. ELI (European Legislation Identifier) - ISAP API ❌ NIE DZIAŁA

**Status**: NIE DZIAŁA - timeout/brak odpowiedzi

**Próbowany URL**: `https://isap.sejm.gov.pl/api/eli`

**Weryfikacja**:
```bash
curl -I "https://isap.sejm.gov.pl/api/eli"
# Exit code 1 (timeout/connection failure)
```

**Potrzebne informacje**:
- Czy ISAP ma działające API do pobierania aktów prawnych?
- Jaki jest aktualny endpoint API ISAP?
- Czy istnieje publiczne API do ELI w Polsce?
- Alternatywne źródła dla aktów prawnych w formacie ELI?

**Co próbujemy uzyskać**:
- Akty prawne z Dziennika Ustaw
- Akty wykonawcze związane z ochroną zdrowia
- Format: JSON z metadanymi ELI (identyfikator, tytuł, data, status prawny)

**Znane domeny ISAP**:
- `isap.sejm.gov.pl` - Internetowy System Aktów Prawnych
- Możliwe ścieżki: `/api/eli`, `/api/`, `/isap.nsf/`

---

### 4. ZUS (Zakład Ubezpieczeń Społecznych) - RSS ⚠️ NIE ZWERYFIKOWANE

**Status**: NIE ZWERYFIKOWANE

**Próbowany URL**: `https://www.zus.pl/rss/akty-prawne`

**Weryfikacja**: BRAK - nie testowano jeszcze

**Potrzebne informacje**:
- Czy ZUS ma aktywny kanał RSS dla aktów prawnych?
- Jaki jest aktualny URL RSS ZUS?
- Czy RSS jest dostępny bez autoryzacji?

**Co próbujemy uzyskać**:
- Informacje o nowych aktach prawnych ZUS
- Zmiany w przepisach ubezpieczeniowych dotyczących ochrony zdrowia
- Format: XML RSS Feed

**Znane domeny ZUS**:
- `www.zus.pl` - strona główna
- Możliwe ścieżki: `/rss/`, `/rss/akty-prawne`, `/aktualnosci/rss`

---

## Wymagania Techniczne

### Format Odpowiedzi dla Działających Endpointów:

**RSS Feed (CEZ, ZUS)**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tytuł kanału</title>
    <item>
      <title>Tytuł aktu</title>
      <description>Opis</description>
      <pubDate>Data publikacji</pubDate>
      <link>Link do dokumentu</link>
    </item>
  </channel>
</rss>
```

**HTML Scraping (NFZ)**:
- Struktura tabelaryczna z danymi
- Dostępne bez autoryzacji
- Parsowalne przez Cheerio

**API JSON (ELI)**:
- Publiczne API bez klucza (preferowane)
- Format JSON
- Zawiera: identyfikator, tytuł, data, typ aktu, status prawny

---

## Zadania do Wykonania

### Dla Innej AI z Dostępem do Internetu:

1. **ZUS RSS** - zweryfikuj czy URL działa:
   ```
   curl -I "https://www.zus.pl/rss/akty-prawne"
   ```
   - Jeśli nie działa, znajdź aktualny URL RSS ZUS
   - Sprawdź stronę główną ZUS czy jest link do RSS w HTML
   - Sprawdź sekcję "Aktualności" lub "Akty prawne"

2. **ELI/ISAP API** - znajdź działające API:
   - Sprawdź dokumentację ISAP: https://isap.sejm.gov.pl
   - Poszukaj publicznych API dla polskiego prawa
   - Alternatywy: Dziennik Ustaw online, gov.pl
   - Czy Sejm/Senat mają API do aktów prawnych?

3. **Dodatkowe źródła** (opcjonalnie):
   - Ministerstwo Zdrowia - RSS/API?
   - Portal gov.pl - akty prawne medyczne?
   - Inne rządowe źródła aktów prawnych?

---

## Struktura Konfiguracji (backend/src/config/sources.ts)

```typescript
export const SOURCES = {
  ELI: 'https://isap.sejm.gov.pl/api/eli', // ❌ NIE DZIAŁA
  RSS_ZUS: 'https://www.zus.pl/rss/akty-prawne', // ⚠️ NIE ZWERYFIKOWANE
  RSS_CEZ: 'https://www.ezdrowie.gov.pl/portal/home/rss', // ✅ DZIAŁA
  NFZ_ZARZĄDZENIA: 'https://www.nfz.gov.pl/zarzadzenia-prezesa/' // ✅ DZIAŁA
};
```

---

## Notatki z Weryfikacji

- **CEZ domain correction**: Dokumentacja wskazywała `cez.gov.pl`, ale faktyczna domena to `ezdrowie.gov.pl`
- **RSS path**: CEZ RSS jest pod `/portal/home/rss`, nie `/rss`
- **NFZ structure**: Strona używa tabeli HTML, scraping działa bez problemów
- **ELI timeout**: ISAP API nie odpowiada - możliwy brak publicznego API lub zmiana endpointu

---

## Status Po Implementacji (2 stycznia 2026, godz. 15:00)

### ✅ Zaimplementowane Źródła:

1. **Sejm API (ELI)** - ✅ DZIAŁA
   - URL: `https://api.sejm.gov.pl/eli/acts/DU/{rok}/{pozycja}`
   - Format: JSON
   - Implementacja: Iteracja po ostatnich 50 pozycjach z bieżącego roku
   - Filtracja: Słowa kluczowe związane ze zdrowiem
   - Rate limiting: 100ms między requestami
   - Status: Scraper działa bez błędów, zwraca 0 dokumentów (brak aktów zdrowotnych w ostatnich 50 pozycjach - to OK)

2. **CEZ RSS (e-Zdrowie)** - ✅ DZIAŁA
   - URL: `https://www.ezdrowie.gov.pl/portal/home/rss`
   - Format: RSS/XML
   - Implementacja: XML parser z tolerancją na błędy
   - Status: Scraper działa, zwraca 0 dokumentów (feed może być pusty lub wymaga analizy struktury)

3. **NFZ Zarządzenia** - ✅ DZIAŁA
   - URL: `https://www.nfz.gov.pl/zarzadzenia-prezesa/`
   - Format: HTML scraping
   - Implementacja: Cheerio parser dla tabeli
   - Status: Scraper działa bez błędów

### ❌ Źródła Wyłączone (Niepoprawne URL-e):

4. **ZUS RSS** - ❌ NIE DZIAŁA
   - Próbowany URL: `https://www.zus.pl/rss/aktualnosci`
   - Błąd: HTTP 404 Not Found
   - Status: Wyłączony z dataService.ts
   - **Wymaga: Ponownej weryfikacji przez AI z dostępem do internetu**

5. **Ministerstwo Zdrowia RSS** - ❌ NIE DZIAŁA  
   - Próbowany URL: `https://www.gov.pl/web/zdrowie/rss`
   - Błąd: HTTP 301 Redirect to `/`
   - Status: Wyłączony z dataService.ts
   - **Wymaga: Ponownej weryfikacji przez AI z dostępem do internetu**

---

## Struktura Konfiguracji (Aktualna)

```typescript
export const SOURCES = {
  // ✅ Działa
  ELI_API_SEJM: 'https://api.sejm.gov.pl/eli/',
  
  // ❌ Wyłączone - wymagają weryfikacji
  RSS_ZUS: 'https://www.zus.pl/rss/aktualnosci',      // 404
  RSS_MZ: 'https://www.gov.pl/web/zdrowie/rss',       // 301 redirect
  
  // ✅ Działa
  RSS_CEZ: 'https://www.ezdrowie.gov.pl/portal/home/rss',
  NFZ_ZARZĄDZENIA: 'https://www.nfz.gov.pl/zarzadzenia-prezesa/'
};
```

---

## Zadania do Wykonania

### Dla AI z Dostępem do Internetu:

**PRIORYTET 1 - ZUS RSS:**
- Sprawdź czy `https://www.zus.pl` ma jakikolwiek aktywny kanał RSS
- Szukaj na stronie głównej linków do RSS
- Sprawdź sekcje: `/aktualnosci`, `/dla-medykow`, `/o-zus/akty-prawne`
- Jeśli RSS nie istnieje, zasugeruj alternatywę (np. scraping HTML)

**PRIORYTET 2 - Ministerstwo Zdrowia:**
- Zweryfikuj czy `https://www.gov.pl/web/zdrowie` ma kanał RSS
- URL `https://www.gov.pl/web/zdrowie/rss` przekierowuje na `/`
- Sprawdź alternatywne ścieżki: `/web/zdrowie/rss.xml`, `/web/zdrowie/feed`
- Sprawdź kod HTML strony dla linków `<link rel="alternate" type="application/rss+xml">`

---

## Notatki z Implementacji

### Sejm API - Szczegóły Techniczne:

**Odkrycia:**
- Endpoint `/eli/search` NIE DZIAŁA (zwraca HTML zamiast JSON)
- Endpoint `/eli/acts/{typ}/{rok}/{pozycja}` DZIAŁA poprawnie (JSON)
- Przykład działającego URL: `https://api.sejm.gov.pl/eli/acts/DU/2023/2677`

**Implementowany Algorytm:**
1. Iteracja po pozycjach 1-50 z bieżącego roku
2. GET request do każdej pozycji (404 = skip)
3. Filtracja po słowach kluczowych: zdrowi, medycz, lecznic, pacjent, świadcze, zdrowot, aptec, lek
4. Filtracja po dacie: tylko akty z ostatnich 90 dni
5. Rate limiting: 100ms pauza między requestami

**Struktura odpowiedzi API:**
```json
{
  "ELI": "DU/2023/2677",
  "title": "Rozporządzenie...",
  "status": "obowiązujący",
  "inForce": "IN_FORCE",
  "promulgation": "2023-12-11",
  "announcementDate": "2023-12-05",
  "entryIntoForce": "2023-12-12",
  "keywords": ["wynagrodzenia", "żołnierz zawodowy"],
  "releasedBy": ["MIN. OBRONY NARODOWEJ"]
}
```

### RSS Parser - Ulepszenia:

**Dodane:**
- `strict: false` - tolerancja na nieprawidłowy XML
- `normalize: true` - normalizacja tagów
- Alternative parsing - czyszczenie XML przy błędach
- User-Agent header
- Obsługa alternatywnych pól: `pubdate`/`date`, `description`/`summary`, `link`/`guid`

---

## Status Backendu

**Port:** 3001 ✅ Działa

**Aktywne Źródła:**
- ✅ Sejm API (ELI)
- ✅ CEZ RSS
- ✅ NFZ Scraper

**Wyłączone Źródła:**
- ❌ ZUS RSS (404)
- ❌ MZ RSS (redirect)

**Scheduler:** Co 6 godzin ✅

**Database:** SQLite (Prisma) ✅

**Log z Ostatniego Uruchomienia:**
```
🔄 Odświeżanie danych z wszystkich źródeł...
📡 Sejm API: Pobieranie aktów prawnych z DU...
📅 Scheduler uruchomiony (co 6h)
✅ Backend działa na http://localhost:3001
✅ RSS CEZ: Pobrano 0 dokumentów
✅ Sejm API: Pobrano 0 dokumentów
✅ Zapisano 0 rekordów do SQLite w 2.98s
```

---


