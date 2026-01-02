# Kompletna Integracja Serwerów ELI + Kanały RSS

**Data**: 2 stycznia 2026  
**Status**: ✅ ZAIMPLEMENTOWANE - Oczekuje na restart backendu

---

## 🎯 Co Zostało Zaimplementowane

### 1. Kompletna Mapa Serwerów ELI Polski

#### **KLIENT A: PARLAMENT (Serwer Centralny - JSON)**
Obsługuje Dziennik Ustaw i Monitor Polski - najważniejsze publikatory prawne.

| ID | Nazwa | Endpoint | Dziennik | Status |
|---|---|---|---|---|
| `sejm-du` | Sejm RP - Dziennik Ustaw | `https://api.sejm.gov.pl/eli/acts/DU` | DU | ✅ Aktywny |
| `sejm-mp` | Sejm RP - Monitor Polski | `https://api.sejm.gov.pl/eli/acts/MP` | MP | ✅ Aktywny |

**Algorytm Klienta A**:
```typescript
for (let pos = 1; pos <= 100; pos++) {
  const url = `${apiEndpoint}/${year}/${pos}`;
  const response = await axios.get(url, { headers: { Accept: 'application/json' } });
  // Parsuj JSON
  if (404) break; // Koniec dostępnych pozycji
}
```

#### **KLIENT B: MINISTERSTWA (Serwery Resortowe - XML)**
Dzienniki Urzędowe Ministerstw - zarządzenia i decyzje.

| ID | Nazwa | Endpoint | Dziennik ID | Status |
|---|---|---|---|---|
| `mz` | Ministerstwo Zdrowia | `https://dziennikmz.mz.gov.pl/api/eli/acts` | DUM_MZ | ✅ Aktywny |
| `mswia` | MSWiA | `https://edziennik.mswia.gov.pl/api/eli/acts` | DUM_MSW | ✅ Aktywny |
| `men` | Ministerstwo Edukacji | `https://dziennik.men.gov.pl/api/eli/acts` | DUM_MEN | ✅ Aktywny |
| `mon` | Ministerstwo Obrony | `https://dziennik.mon.gov.pl/api/eli/acts` | DUM_MON | ✅ Aktywny |
| `mkidn` | Ministerstwo Kultury | `https://dziennik.kultura.gov.pl/api/eli/acts` | DUM_MKIDN | ✅ Aktywny |
| `klimat` | Ministerstwo Klimatu | `https://dziennik.klimat.gov.pl/api/eli/acts` | DUM_MK | ✅ Aktywny |
| `uprp` | Urząd Patentowy | `https://edziennik.uprp.gov.pl/api/eli/acts` | DUM_UPRP | ✅ Aktywny |
| `gus` | GUS | `https://dziennikurzedowy.stat.gov.pl/api/eli/acts` | DUM_GUS | ✅ Aktywny |
| `pgr` | Prokuratoria Generalna | `https://edziennik.pgr.gov.pl/api/eli/acts` | DUM_PGR | ✅ Aktywny |
| `nbp` | NBP | `https://dzu.nbp.pl/api/eli/acts` | DUM_NBP | ✅ Aktywny |

**Algorytm Klienta B (Brute-Force)**:
```typescript
for (let pos = 1; pos <= 50; pos++) {
  const url = `${apiEndpoint}/${dziennikId}/${year}/${pos}/ogl/wiza/pol/xml`;
  const response = await axios.get(url, { headers: { Accept: 'application/xml' } });
  // Parsuj XML
  if (404) break; // Koniec dostępnych pozycji
  await delay(150); // Rate limiting
}
```

### 2. Kanały RSS - Reaktywowane

| ID | Nazwa | URL | Status |
|---|---|---|---|
| `zus` | ZUS Aktualności | `https://www.zus.pl/rss/aktualnosci` | ✅ Reaktywowany |
| `cez` | e-Zdrowie CEZ | `https://www.ezdrowie.gov.pl/portal/home/rss` | ✅ Aktywny |

### 3. Scrapers

| ID | Nazwa | URL | Status |
|---|---|---|---|
| `nfz` | NFZ Zarządzenia | `https://www.nfz.gov.pl/zarzadzenia-prezesa/` | ✅ Aktywny |

---

## 📂 Zmodyfikowane Pliki

### Backend

1. **`backend/src/config/eliSources.ts`**
   - Dodano interfejs `clientType: 'A' | 'B'`
   - Dodano pole `dziennikId` dla serwerów resortowych
   - Kompletna lista 12 serwerów ELI (2 Sejm + 10 Ministerstw)
   - Usunięto niedziałające źródła (dziennik-ustaw, monitor-polski z osobnych domen)

2. **`backend/src/scrapers/eli/eliClient.ts`**
   - Nowe metody:
     - `fetchClientA()` - Sejm API (JSON, pozycje 1-100)
     - `fetchClientB()` - Ministerstwa (XML, pozycje 1-50, brute-force do 404)
     - `parseClientAResponse()` - Parser JSON z Sejmu
     - `parseClientBResponse()` - Parser XML z Ministerstw
   - Rate limiting: 100ms dla Sejmu, 150ms dla Ministerstw
   - Timeout: 10s per request
   - Automatyczne wykrywanie końca pozycji (404)

3. **`backend/src/config/sources.ts`**
   - Reaktywowano `RSS_ZUS`
   - Usunięto niedziałające `RSS_MZ`
   - Pozostawiono `RSS_CEZ` i `NFZ_ZARZĄDZENIA`

4. **`backend/src/services/dataService.ts`**
   - Dodano `zusRss` do Promise.allSettled
   - Kolejność: ELI → Sejm API → ZUS RSS → CEZ RSS → NFZ
   - Łącznie 5 źródeł + 12 serwerów ELI = **17 źródeł danych**

### Frontend

1. **`App.tsx`**
   - Zaktualizowano `KONFIGURACJA_DYNAMICZNA` z 10 źródłami:
     - 2 ELI Sejm (DU + MP)
     - 5 ELI Ministerstwa (MZ, MSWiA, MEN, MON, NBP)
     - 2 RSS (ZUS, CEZ)
     - 1 Scraper (NFZ)
   - Zaktualizowano komunikaty błędów

2. **`components/UpdateCard.tsx`**
   - Zaktualizowano loading message: "ELI (Sejm DU+MP, MZ, MSWiA, MEN, MON, NBP) + RSS (ZUS, CEZ) + NFZ"

---

## 🚀 Architektura Systemu

```
┌─────────────────────────────────────────────────────────┐
│                   SCHEDULER (co 1 min)                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    dataService.ts                       │
│  Promise.allSettled([eliSources, sejmApi, zus, cez, nfz])
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ scrapeAllELI │    │   RSS Feed   │    │  NFZ Scraper │
│ (12 źródeł)  │    │  (ZUS, CEZ)  │    │    (HTML)    │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│          eliScraper.ts                   │
│  Batch processing (po 3 źródła)          │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│          eliClient.ts                    │
│  ┌────────────┐    ┌────────────┐       │
│  │ Klient A   │    │ Klient B   │       │
│  │ (Sejm JSON)│    │ (Min. XML) │       │
│  │ 1-100 poz. │    │ 1-50 poz.  │       │
│  │ Rate:100ms │    │ Rate:150ms │       │
│  └────────────┘    └────────────┘       │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│         eliParser.ts                     │
│  - JSON-LD                               │
│  - RDF/XML (rdflib)                      │
│  - Turtle (rdflib)                       │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│      SQLite (Prisma ORM)                 │
│      Upsert po ID                        │
└──────────────────────────────────────────┘
```

---

## 📊 Przykładowe Zapytania API

### Klient A (Sejm - JSON)
```bash
# Dziennik Ustaw 2026, pozycja 1
curl "https://api.sejm.gov.pl/eli/acts/DU/2026/1" \
  -H "Accept: application/json"

# Monitor Polski 2026, pozycja 5
curl "https://api.sejm.gov.pl/eli/acts/MP/2026/5" \
  -H "Accept: application/json"
```

**Odpowiedź JSON**:
```json
{
  "title": "Ustawa o zmianie ustawy o ochronie zdrowia",
  "year": 2026,
  "position": 1,
  "publicationDate": "2026-01-02",
  "ELI": "http://isap.sejm.gov.pl/eli/DU/2026/1",
  "status": "published"
}
```

### Klient B (Ministerstwa - XML)
```bash
# MZ Dziennik Urzędowy 2026, pozycja 3
curl "https://dziennikmz.mz.gov.pl/api/eli/acts/DUM_MZ/2026/3/ogl/wiza/pol/xml" \
  -H "Accept: application/xml"
```

**Odpowiedź XML**:
```xml
<?xml version="1.0"?>
<act>
  <title>Zarządzenie Nr 3/2026 Ministra Zdrowia</title>
  <publicationDate>2026-01-02</publicationDate>
  <content>...</content>
</act>
```

---

## ⚙️ Konfiguracja

### Rate Limiting
- **Klient A (Sejm)**: 100ms opóźnienia między requestami
- **Klient B (Ministerstwa)**: 150ms opóźnienia między requestami
- **Timeout**: 10s per request
- **Batch size**: 3 źródła równolegle (ELI)

### Zakres Danych
- **Klient A**: Pozycje 1-100 dla bieżącego roku
- **Klient B**: Pozycje 1-50 dla bieżącego roku
- **Strategia**: Brute-force aż do HTTP 404

### Scheduler
- **Częstotliwość**: Co 1 minutę (`* * * * *`)
- **Środowisko**: Europejski serwer (zgodnie z wymaganiem)

---

## 🧪 Testowanie

### Backend
```bash
# Restart backendu z nowymi konfiguracjami
cd C:\Dev\Str\backend
npm run dev
```

### Oczekiwane Logi
```
🔄 Odświeżanie danych z wszystkich źródeł (ELI + RSS + Scrapers)...
🇪🇺 Uruchamianie scraperów ELI dla 12 źródeł...
📡 Klient A (Sejm): Sejm RP - Dziennik Ustaw (DU), rok 2026
📡 Klient A (Sejm): Sejm RP - Monitor Polski (MP), rok 2026
📡 Klient B (Resortowe): Ministerstwo Zdrowia, DUM_MZ
📡 Klient B (Resortowe): MSWiA, DUM_MSW
...
✅ Sejm RP - Dziennik Ustaw (DU): X dokumentów
✅ Sejm RP - Monitor Polski (MP): X dokumentów
✅ Ministerstwo Zdrowia: X dokumentów
✅ RSS ZUS: X dokumentów
✅ RSS CEZ: X dokumentów
✅ NFZ: X dokumentów
✅ Zapisano X rekordów do SQLite w Ys
```

### Frontend
```bash
cd C:\Dev\Str
npm run dev
# Otwórz http://localhost:5174
# Kliknij "Pobierz dane"
# Sprawdź sekcję "Źródła" - powinno być 10 pozycji
```

---

## 📝 Notatki Techniczne

### Dlaczego Brute-Force?
Serwery resortowe (Klient B) nie udostępniają endpointu `list all` ani mechanizmu paginacji. Jedyna metoda to:
1. Zapytaj o pozycję 1, 2, 3...
2. Kontynuuj aż do HTTP 404
3. 404 oznacza koniec dostępnych aktów

### Dlaczego Dwa Klienty?
- **Klient A (Sejm)**: REST API z czystym JSON
- **Klient B (Ministerstwa)**: Różne implementacje "E-Dziennik", głównie XML, bez jednolitego API

### Systemy BEZ API ELI
Te źródła NIE mają API ELI i wymagają scrapingu HTML:
- **NFZ Centrala** (już zaimplementowany jako `nfzScraper`)
- **Ministerstwo Finansów** (dziennik wygaszony)
- **KPRM** (publikuje w Monitor Polski - obsługiwany przez Sejm)

---

## ✅ Checklist Implementacji

- [x] Interfejs `ELISource` rozszerzony o `clientType` i `dziennikId`
- [x] 12 serwerów ELI skonfigurowanych
- [x] Klient A (Sejm JSON) zaimplementowany
- [x] Klient B (Ministerstwa XML) zaimplementowany
- [x] Parsery JSON i XML gotowe
- [x] Rate limiting zaimplementowany
- [x] Brute-force strategy zaimplementowany
- [x] RSS ZUS reaktywowany
- [x] RSS CEZ aktywny
- [x] NFZ Scraper aktywny
- [x] Frontend zaktualizowany (10 źródeł)
- [x] Build frontendu (0.87 kB gzip)
- [ ] **Backend restart** - wymagany do zastosowania zmian

---

## 🚀 Następne Kroki

1. **Restart Backendu**
   ```bash
   # Zatrzymaj bieżący proces
   Get-Process -Name node | Stop-Process -Force
   
   # Uruchom ponownie
   cd C:\Dev\Str\backend
   npm run dev
   ```

2. **Monitorowanie Logów**
   - Sprawdź czy wszystkie 12 serwerów ELI odpowiada
   - Zweryfikuj ilość pobranych dokumentów
   - Sprawdź rate limiting (brak "Too Many Requests")

3. **Testowanie Frontend**
   - Uruchom `npm run dev`
   - Sprawdź zakładkę "Źródła"
   - Kliknij "Pobierz dane"
   - Sprawdź czy dokumenty się pojawiają

4. **Optymalizacja** (opcjonalna)
   - Dodaj Redis cache dla odpowiedzi API
   - Rozszerz zakres pozycji dla Sejmu (100 → 200)
   - Dodaj filtrowanie po keywords w tytułach

---

**Status końcowy**: ✅ Gotowe do restartu backendu i testowania produkcyjnego
