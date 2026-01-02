# Dokumentacja Techniczna Backend - Strażnik Prawa (V 13.0)

## 1. Architektura Systemu (Pipeline Przetwarzania)

System działa w modelu "Zero AI Assessment". Architektura backendu składa się z czterech odizolowanych warstw:

### A. Warstwa Ingestii (Data Ingestion Layer)
- **Moduł ELI**: Bezpośredni klient REST odpytujący `isap.sejm.gov.pl/api/eli`. Pobiera surowe deskryptory aktów (format JSON-LD/RDF).
- **Moduł RSS**: Klient XML monitorujący strumienie ZUS i CEZ. Agreguje nowe wpisy na podstawie znacznika czasowego `<pubDate>`.
- **Moduł SCRAPER (NFZ)**: Mechanizm typu "Headless Browser" lub "HTTP Client" parsujący strukturę tabelaryczną strony `nfz.gov.pl/zarzadzenia-prezesa/`. Wyciąga surowy tekst z komórek tabeli.

### B. Warstwa Normalizacji (Normalization Layer)
W tej warstwie dane są przetwarzane bez użycia AI - bezpośrednie mapowanie pól na strukturę JSON `LegalUpdate`.
- **Wejście**: Surowy kod HTML tabeli NFZ lub XML z RSS.
- **Zadanie**: Mapowanie pól na strukturę JSON `LegalUpdate`.
- **Restrykcja**: Brak interpretacji, tylko faktograficzne dane ze źródeł.

### C. Warstwa API (Service Layer)
Udostępnia endpointy dla Frontendu zgodnie ze specyfikacją OpenAPI.

## 2. Implementacja Mechanizmu NFZ (Scraper)

Backend implementuje cykliczny proces (Cron Job):
1. Odpytanie URL NFZ.
2. Pobranie fragmentu DOM zawierającego tabelę zarządzeń.
3. Przekazanie fragmentu do Warstwy Normalizacji.
4. Zapisanie seryjnego numeru zarządzenia jako unikalnego ID w celu uniknięcia duplikatów.

## 3. Szczegóły API dla Frontendu

Backend wystawia następujące zasoby:

### `GET /updates`
Zwraca listę znormalizowanych faktów prawnych. 
- Parametr `range`: Filtrowanie po dacie publikacji.
- Parametr `method`: Filtrowanie po źródle (ELI, RSS, Scraper).

### `POST /export/extract`
Generuje czysty wyciąg tekstowy z wybranych rekordów. Nie jest to analiza, a jedynie agregacja pól `officialRationale` i `title`.

## 4. Bezpieczeństwo i Autentyczność
Każdy rekord zawiera `sourceUrl`. Frontend weryfikuje domenę linku (whitelist: `*.gov.pl`, `*.zus.pl`).

## 5. Implementacja (Status: ✅ DONE)

System został zaimplementowany zgodnie z architekturą "Zero AI":
- ✅ Scraper ELI (REST API)
- ✅ Scraper RSS (ZUS)
- ✅ Scraper NFZ (Cheerio HTML parsing)
- ✅ Scheduler (node-cron, co 6h)
- ✅ REST API zgodne z OpenAPI spec
- ✅ Brak jakiejkolwiek interpretacji AI
