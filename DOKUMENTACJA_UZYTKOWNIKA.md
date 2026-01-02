# Dokumentacja Użytkownika - Strażnik Prawa Medycznego

## 1. Wprowadzenie

### 1.1 Czym jest Strażnik Prawa Medycznego?

Strażnik Prawa Medycznego to zaawansowana aplikacja webowa służąca do automatycznego monitorowania, agregacji i archiwizacji zmian prawnych z oficjalnych źródeł polskich instytucji państwowych w zakresie prawa medycznego i zdrowotnego.

System działa w oparciu o zasadę **Zero-AI Assessment**, co oznacza że:
- **NIE interpretuje** aktów prawnych
- **NIE dodaje** własnych ocen czy komentarzy
- **NIE sugeruje** działań użytkownikowi
- Przeprowadza wyłącznie **faktograficzną ingestię** danych 1:1 ze źródeł

### 1.2 Dla kogo jest przeznaczony?

System został zaprojektowany dla:
- **Radców prawnych** i prawników w placówkach medycznych
- **Dyrektorów** instytucji służby zdrowia
- **Działów prawnych** szpitali i przychodni
- **NFZ kontraktantów** śledzących zarządzenia Prezesa
- **Administratorów systemów e-Zdrowie** (P1/P2)
- Wszystkich profesjonalistów wymagających bieżącej wiedzy o zmianach prawnych

### 1.3 Główne funkcje

1. **Automatyczna agregacja danych** z 5 oficjalnych źródeł państwowych
2. **Normalizacja danych** do jednolitego formatu JSON
3. **Filtrowanie czasowe** - wybór zakresu 7, 30 lub 90 dni
4. **Archiwizacja dokumentów** - lokalne przechowywanie ważnych aktów
5. **Grounding links** - weryfikacja źródeł użytych przez AI
6. **Generowanie raportów faktograficznych** - wyciągi do dalszego wykorzystania
7. **Konfiguracja źródeł** - aktywacja/deaktywacja poszczególnych źródeł

## 2. Pierwsze kroki

### 2.1 Instalacja i konfiguracja

#### Krok 1: Wymagania wstępne
Upewnij się że masz zainstalowane:
- **Node.js** w wersji 18.x lub nowszej
- **npm** (Node Package Manager)

Sprawdź wersję:
```bash
node --version  # Powinno wyświetlić v18.x.x lub nowsze
npm --version   # Powinno wyświetlić wersję npm
```

#### Krok 2: Sklonuj repozytorium
```bash
git clone https://github.com/aggregatemy/Str.git
cd Str
```

#### Krok 3: Zainstaluj zależności
```bash
npm install
```

Ten krok pobiera wszystkie wymagane pakiety:
- React 19
- Google Gemini AI SDK
- Vite (build tool)
- TypeScript

### 2.2 Uzyskanie klucza API Gemini

Klucz API Gemini jest **absolutnie wymagany** do działania aplikacji.

#### Krok po kroku:
1. Przejdź do: **https://ai.google.dev/**
2. Zaloguj się kontem Google
3. Kliknij **"Get API Key"**
4. Utwórz nowy projekt (jeśli jeszcze nie masz)
5. Wygeneruj klucz API
6. **Skopiuj klucz** - będzie potrzebny w następnym kroku

⚠️ **UWAGA**: Nie udostępniaj swojego klucza API nikomu! Jest to prywatne dane uwierzytelniające.

### 2.3 Konfiguracja .env.local

#### Krok 1: Utwórz plik .env.local
W głównym katalogu projektu (tam gdzie znajduje się package.json):

**Linux/Mac:**
```bash
touch .env.local
```

**Windows:**
```bash
echo. > .env.local
```

#### Krok 2: Dodaj klucz API
Otwórz plik `.env.local` w edytorze tekstowym i dodaj:

```env
GEMINI_API_KEY=TU_WKLEJ_SWOJ_KLUCZ_API
```

Zamień `TU_WKLEJ_SWOJ_KLUCZ_API` na rzeczywisty klucz uzyskany w kroku 2.2.

Przykład:
```env
GEMINI_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrs
```

#### Krok 3: Zweryfikuj plik
Upewnij się że:
- Plik nazywa się dokładnie `.env.local` (z kropką na początku)
- Nie ma spacji wokół znaku `=`
- Klucz jest w jednej linii

🔒 **Bezpieczeństwo**: Plik `.env.local` jest w `.gitignore` i **nie zostanie** commitowany do repozytorium Git.

### 2.4 Pierwsze uruchomienie

#### Uruchom aplikację:
```bash
npm run dev
```

Powinieneś zobaczyć komunikat podobny do:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Otwórz przeglądarkę:
Przejdź do: **http://localhost:5173**

🎉 **Gratulacje!** Aplikacja działa.

## 3. Interfejs użytkownika

### 3.1 Nawigacja

Aplikacja posiada minimalistyczny interfejs z trzema głównymi widokami dostępnymi przez zakładki u góry ekranu:

#### **Dane Faktograficzne** (widok główny)
- Wyświetla najnowsze aktualizacje prawne
- Umożliwia filtrowanie według zakresu czasowego
- Pozwala na zaznaczanie dokumentów do raportu
- Przycisk archiwizacji dla każdego dokumentu

#### **Zarchiwizowane** (archiwum)
- Lista zapisanych dokumentów
- Możliwość usunięcia z archiwum (ponowne kliknięcie przycisku archiwizacji)
- Trwałe przechowywanie w localStorage przeglądarki

#### **Parametry API** (konfiguracja źródeł)
- Lista wszystkich źródeł danych
- Przełączniki aktywacji/deaktywacji dla każdego źródła
- Informacje o URL endpointów
- Kolory badge'ów: niebieski (ELI), zielony (RSS), pomarańczowy (Scraper)

### 3.2 Widoki szczegółowe

#### Widok "Dane Faktograficzne"
Każda karta aktualizacji zawiera:
- **Checkbox** - zaznaczanie do raportu
- **Badge metody ingestii** - ELI API / RSS / Scraper
- **Kategoria** - typ dokumentu (Ustawa, Zarządzenie, Komunikat)
- **Data publikacji** - w formacie czytelnym
- **Tytuł** - pełna nazwa aktu prawnego
- **ELI URI** - identyfikator europejski (jeśli dostępny)
- **Status prawny** - metadane z systemu źródłowego
- **Oficjalne uzasadnienie** - tekst z dokumentu źródłowego
- **ID systemowe** - unikalny identyfikator
- **Przycisk archiwizacji** - zapis do archiwum

#### Widok "Zarchiwizowane"
- Identyczny układ kart jak w widoku głównym
- Dokumenty pozostają w archiwum nawet po odświeżeniu strony
- Zapisane w localStorage przeglądarki
- Możliwość usunięcia (kliknij ponownie "Zarchiwizowano")

#### Widok "Parametry API"
Lista źródeł z informacjami:
- **Nazwa źródła** (np. "ISAP ELI (System API)")
- **Endpoint URL** - adres API/RSS/strony
- **Typ ingestii** - badge z kodem (ELI/RSS/SCRAPER)
- **Przełącznik** - aktywacja/deaktywacja źródła

### 3.3 Filtry czasowe (7d, 30d, 90d)

U góry ekranu znajdują się 3 przyciski filtrowania czasowego:

- **7 dni** - aktualizacje z ostatniego tygodnia (domyślne)
- **30 dni** - aktualizacje z ostatniego miesiąca
- **90 dni** - aktualizacje z ostatniego kwartału

#### Jak używać:
1. Kliknij wybrany przycisk (np. "30 dni")
2. System automatycznie pobierze dane z nowym zakresem
3. Wyświetli się komunikat ładowania
4. Po chwili zobaczysz zaktualizowaną listę

⚠️ **Uwaga**: Zmiana zakresu czasowego **nie wpływa** na archiwum - tam zachowują się wszystkie kiedykolwiek zapisane dokumenty.

## 4. Źródła danych

### 4.1 ISAP ELI (System API)

#### Co to jest ELI?
**ELI (European Legislation Identifier)** to europejski standard identyfikacji aktów prawnych. ISAP to Internetowy System Aktów Prawnych prowadzony przez Kancelarię Sejmu RP.

#### Jakie dane dostarcza?
- **Ustawy** z pełnymi metadanymi
- **Rozporządzenia** Rady Ministrów
- **Akty wykonawcze** z ministerstw
- **ELI URI** - unikalne identyfikatory europejskie
- **Status prawny** - obowiązujący/uchylony/zmieniony
- **Oficjalne uzasadnienia** projektów ustaw

#### Charakterystyka techniczna:
- **Metoda**: Protokół ELI API (structured data)
- **Format**: JSON z metadanymi ELI
- **Endpoint**: https://isap.sejm.gov.pl/api/eli
- **Aktualizacja**: Przy publikacji w Dzienniku Ustaw
- **Badge**: Niebieski "Protokół ELI API"

#### Jak włączyć/wyłączyć?
1. Przejdź do zakładki **"Parametry API"**
2. Znajdź wiersz **"ISAP ELI (System API)"**
3. Kliknij przełącznik po prawej stronie
4. Status zapisze się automatycznie w localStorage

### 4.2 ZUS (Strumień RSS)

#### Rodzaj danych
Zakład Ubezpieczeń Społecznych publikuje przez RSS:
- **Komunikaty ZUS** o zmianach w przepisach
- **Nowe składki** i stawki
- **Zmiany w e-PIT** i e-ZLA
- **Terminy płatności** składek
- **Informacje o zasiłkach** (chorobowy, macierzyński, itp.)

#### Charakterystyka techniczna:
- **Metoda**: Strumień RSS/XML
- **Format**: RSS 2.0 / Atom
- **Endpoint**: https://www.zus.pl/rss
- **Aktualizacja**: Real-time (ciągła)
- **Częstotliwość**: Kilka razy w tygodniu
- **Badge**: Zielony "Kanał RSS/XML"

#### Jak włączyć/wyłączyć?
Analogicznie jak ISAP ELI - przez zakładkę "Parametry API".

### 4.3 CEZ (Strumień RSS)

#### Charakterystyka źródła
Centrum e-Zdrowia odpowiada za systemy informatyczne w ochronie zdrowia:
- **Aktualizacje P1** (e-Recepta)
- **Zmiany w P2** (e-Skierowanie, e-Zlecenie)
- **Komunikaty techniczne** o przerwach w systemach
- **Nowe funkcjonalności** platform e-Zdrowia
- **Harmonogramy wdrożeń** nowych modułów

#### Charakterystyka techniczna:
- **Metoda**: Strumień RSS/XML
- **Format**: RSS 2.0
- **Endpoint**: https://cez.gov.pl/rss
- **Aktualizacja**: Real-time
- **Badge**: Zielony "Kanał RSS/XML"

### 4.4 NFZ (Backendowy Scraper)

#### Specyfika scrapingu
NFZ (Narodowy Fundusz Zdrowia) **nie udostępnia API ani RSS**, dlatego system wykorzystuje backendowy mechanizm scrapingowy.

#### Zarządzenia Prezesa NFZ
Scraper ekstrakcji z strony: https://www.nfz.gov.pl/zarzadzenia-prezesa/

Pobierane dane:
- **Numer zarządzenia** (np. 123/2026/DSOZ)
- **Data wydania**
- **Tytuł zarządzenia**
- **Link do pełnego dokumentu PDF**

#### Przykłady zarządzeń:
- Zmiany w umowach o udzielanie świadczeń
- Nowe procedury refundacyjne
- Aktualizacje cenników świadczeń
- Wytyczne dotyczące rozliczeń

#### Charakterystyka techniczna:
- **Metoda**: Backendowy Scraper HTML
- **Format**: Ekstrakcja z tabeli HTML
- **Endpoint**: https://www.nfz.gov.pl/zarzadzenia-prezesa/
- **Aktualizacja**: Przy publikacji nowego zarządzenia
- **Badge**: Pomarańczowy "Silnik Scrapera NFZ"

⚠️ **Uwaga**: Scraper może być czasowo niedostępny jeśli struktura strony NFZ ulegnie zmianie.

### 4.5 e-Zdrowie (Strumień RSS)

#### Komunikaty e-Zdrowie
Dodatkowe źródło informacji o systemach informatycznych w ochronie zdrowia:
- **Komunikaty P1/P2** - szczegółowe informacje techniczne
- **Awarie i przerwy techniczne**
- **Nowe wersje** aplikacji gabinet.gov.pl
- **Szkolenia i webinary** dla użytkowników
- **FAQ i instrukcje** obsługi systemów

#### Charakterystyka techniczna:
- **Metoda**: Strumień RSS/XML
- **Format**: RSS 2.0 / Atom
- **Aktualizacja**: Real-time
- **Badge**: Zielony "Kanał RSS/XML"

⚠️ **Uwaga**: To źródło może być opcjonalne w niektórych konfiguracjach.

## 5. Praca z aktualizacjami

### 5.1 Przeglądanie aktualizacji prawnych

#### Automatyczne odświeżanie
Po wejściu na stronę lub zmianie zakresu czasowego, system:
1. Wyświetla komunikat ładowania (3 animowane placeholdery)
2. Wysyła zapytanie do Gemini AI API
3. Gemini wyszukuje dane przez Google Search
4. Parsuje HTML/XML/JSON ze źródeł
5. Normalizuje dane do formatu LegalUpdate
6. Zwraca listę aktualizacji + grounding links

#### Czytanie karty aktualizacji
Każda karta zawiera sekcje:

**Nagłówek:**
- Badge metody (niebieski/zielony/pomarańczowy)
- Kategoria dokumentu
- Data publikacji

**Treść główna:**
- Tytuł aktu (uppercase, pogrubiony)
- ELI URI (jeśli dostępny) - w szarym boxie

**Sekcja metadanych:**
- Status prawny - w czerwonym ramce
- Oficjalne uzasadnienie - w sekcji z lewym borderem

**Stopka:**
- ID systemowe
- Przycisk archiwizacji

### 5.2 Znaczniki metod ingestii (ELI, RSS, Scraper)

#### Niebieski badge: "Protokół ELI API"
- Dane z ISAP
- Najwyższa jakość metadanych
- Pełne ELI URI dostępne
- Status prawny zweryfikowany

#### Zielony badge: "Kanał RSS/XML"
- Dane z ZUS, CEZ, e-Zdrowie
- Szybka aktualizacja (real-time)
- Może nie zawierać ELI URI
- Czasem brak szczegółowych uzasadnień

#### Pomarańczowy badge: "Silnik Scrapera NFZ"
- Dane z tabeli HTML NFZ
- Może zawierać artefakty formatowania
- Brak ELI URI
- Podstawowe metadane (nr, data, tytuł)

### 5.3 Interpretacja statusu prawnego

Status prawny to metadane pobrane bezpośrednio ze źródła. Typowe wartości:

#### Dla ustaw (ISAP ELI):
- **"Obowiązujący"** - akt aktualnie w mocy
- **"Uchylony"** - akt już nie obowiązuje
- **"Zmieniony"** - akt był nowelizowany
- **"W vacatio legis"** - akt opublikowany, ale jeszcze nie obowiązuje

#### Dla zarządzeń NFZ:
- **"Opublikowane"** - zarządzenie wydane
- **"W trakcie konsultacji"** - projekt w konsultacjach
- **"Uchylone"** - zarządzenie przestało obowiązywać

#### Dla komunikatów (ZUS, CEZ):
- **"Aktualny"** - komunikat bieżący
- **"Archiwalny"** - komunikat historyczny

⚠️ **Pamiętaj**: System **nie interpretuje** statusu prawnego - tylko go wyświetla.

### 5.4 Oficjalne uzasadnienia

Pole "Oficjalne uzasadnienie / Cel zmiany" zawiera:

#### Dla ustaw z ISAP:
- Uzasadnienie projektu ustawy (jeśli dostępne w systemie)
- Cel wprowadzenia zmiany prawnej
- Cytaty z dokumentów źródłowych

#### Dla zarządzeń NFZ:
- Cel zarządzenia (jeśli jest w dokumencie)
- Podstawa prawna
- Czasem: "Brak danych źródłowych" (gdy uzasadnienie nie zostało opublikowane)

#### Dla komunikatów RSS:
- Treść komunikatu
- Opis zmiany
- Instrukcje dla odbiorców

**Zasada 1:1**: Tekst jest przepisywany ze źródła **bez interpretacji** przez AI.

## 6. Archiwizacja dokumentów

### 6.1 Jak zapisać dokument do archiwum?

#### Krok po kroku:
1. Znajdź dokument który chcesz zapisać
2. Przewiń w dół karty do stopki
3. Kliknij przycisk **"Archiwizuj dokument"** (ikona zakładki)
4. Ikona zmieni się na wypełnioną zakładkę
5. Tekst zmieni się na **"Zarchiwizowano"** (kolor czerwony)

✅ **Gotowe!** Dokument został zapisany w localStorage przeglądarki.

### 6.2 Zarządzanie archiwum

#### Przeglądanie archiwum:
1. Kliknij zakładkę **"Zarchiwizowane"** u góry
2. Zobaczysz listę wszystkich zapisanych dokumentów
3. Karty wyglądają identycznie jak w widoku głównym

#### Trwałość danych:
- Archiwum jest zapisywane w **localStorage przeglądarki**
- Dane **przetrwają** zamknięcie przeglądarki
- Dane **przetrwają** zamknięcie komputera
- Dane **pozostaną** po odświeżeniu strony (F5)

⚠️ **Uwaga**: Dane są lokalne dla przeglądarki. Jeśli zmienisz przeglądarkę lub komputer, archiwum nie będzie widoczne (chyba że wyeksportujesz localStorage).

### 6.3 Usuwanie z archiwum

#### Jak usunąć dokument:
1. Przejdź do zakładki **"Zarchiwizowane"**
2. Znajdź dokument do usunięcia
3. Kliknij przycisk **"Zarchiwizowano"** (czerwony z pełną zakładką)
4. Dokument zostanie **natychmiast usunięty** z archiwum

⚠️ **Uwaga**: Usunięcie jest **nieodwracalne** (brak przycisku "cofnij"). Jeśli usuniesz przez przypadek, musisz ponownie zapisać dokument z widoku głównego.

## 7. Generowanie raportów

### 7.1 Zaznaczanie dokumentów

#### Automatyczne zaznaczenie:
Po pobraniu danych, **wszystkie dokumenty są automatycznie zaznaczone** (checkboxy zaznaczone).

#### Ręczne zaznaczanie/odznaczanie:
1. Kliknij checkbox w lewym górnym rogu karty
2. Checkbox zaznaczony (✓) = dokument wejdzie do raportu
3. Checkbox pusty ( ) = dokument zostanie pominięty

#### Licznik zaznaczonych:
U dołu ekranu pojawia się przycisk:
**"Wygeneruj Wyciąg Faktograficzny (N)"**

gdzie N = liczba zaznaczonych dokumentów.

### 7.2 Generowanie wyciągu faktograficznego

#### Krok po kroku:
1. Zaznacz dokumenty które chcesz uwzględnić (lub pozostaw wszystkie)
2. Kliknij przycisk **"Wygeneruj Wyciąg Faktograficzny (N)"** u dołu ekranu
3. Otworzy się okno modalne z komunikatem ładowania
4. Gemini AI sformatuje dane (5-15 sekund)
5. Wyświetli się gotowy raport

#### Zawartość raportu:
Raport zawiera dla każdego dokumentu:
```
DOKUMENT: [Tytuł aktu]
ID: [ELI URI lub ID systemowe]
TREŚĆ UZASADNIENIA: [Oficjalne uzasadnienie]

---

DOKUMENT: [Następny dokument]
...
```

#### Charakterystyka:
- **Brak wstępu** - od razu dane
- **Brak zakończenia** - bez podsumowań
- **Brak komentarzy** - tylko fakty
- **Suche dane** - gotowe do dalszego przetworzenia

### 7.3 Kopiowanie do schowka

#### Jak skopiować raport:
1. Po wygenerowaniu raportu, w stopce okna modalnego kliknij **"Kopiuj do schowka"**
2. Pojawi się krótkie powiadomienie (zależne od przeglądarki)
3. Raport jest teraz w schowku systemowym

#### Co dalej z raportem:
- Wklej do **dokumentu Word** (Ctrl+V / Cmd+V)
- Wklej do **email'a** jako briefing dla zespołu
- Wklej do **notatki** w systemie zarządzania sprawami
- Wklej do **arkusza Excel** jako dane źródłowe
- Wklej do **Slack/Teams** jako update dla zespołu

### 7.4 Wykorzystanie raportów

#### Przykładowe zastosowania:

**Dla radcy prawnego:**
- Cotygodniowy przegląd zmian prawnych dla zarządu
- Załącznik do analizy prawnej
- Źródło do opinii prawnej

**Dla dyrektora:**
- Miesięczny brief o zmianach w prawie medycznym
- Podstawa do decyzji strategicznych
- Komunikat do personelu o nadchodzących zmianach

**Dla działu kontraktów z NFZ:**
- Lista nowych zarządzeń Prezesa
- Podstawa do aktualizacji umów
- Alert o zmianach w refundacji

**Dla administratora e-Zdrowie:**
- Komunikaty o aktualizacjach P1/P2
- Harmonogram przerw technicznych
- Changelog systemów CEZ

## 8. Konfiguracja zaawansowana

### 8.1 localStorage

#### Co jest zapisywane?
System wykorzystuje localStorage przeglądarki do zapisywania:

**Klucz: `straznik_prawa_v13_konfig`**
- Konfiguracja źródeł (aktywne/nieaktywne)
- Tematy strategiczne
- Format: JSON

**Klucz: `zapisane_v13`**
- Lista zarchiwizowanych dokumentów
- Format: JSON (tablica LegalUpdate)

#### Jak wyczyścić localStorage?
**Opcja 1: Przez DevTools**
1. Otwórz DevTools (F12)
2. Zakładka "Application" (Chrome) lub "Storage" (Firefox)
3. Sekcja "Local Storage"
4. Znajdź `localhost:5173`
5. Usuń klucze ręcznie

**Opcja 2: Przez konsolę**
```javascript
localStorage.removeItem('straznik_prawa_v13_konfig');
localStorage.removeItem('zapisane_v13');
```

**Opcja 3: Wyczyść wszystko**
```javascript
localStorage.clear();
```

⚠️ **Uwaga**: Wyczyszczenie localStorage **usunie** całe archiwum i konfigurację!

### 8.2 Tematy strategiczne

#### Co to są tematy strategiczne?
Tematy strategiczne to słowa kluczowe przekazywane do Gemini AI, które wpływają na:
- **Filtrowanie wyników** wyszukiwania
- **Priorytetyzację** dokumentów
- **Kontekst** dla AI podczas parsowania

#### Domyślne tematy:
```javascript
[
  "Zarządzenia Prezesa NFZ",
  "Ustawy zdrowotne",
  "Komunikaty ZUS",
  "P1/P2/e-Zdrowie"
]
```

#### Jak zmienić tematy? (dla zaawansowanych)
⚠️ Wymaga modyfikacji kodu źródłowego w `App.tsx`:

```typescript
const KONFIGURACJA_DYNAMICZNA: SystemConfig = {
  masterSites: [ /* ... */ ],
  strategicTopics: [
    "Zarządzenia Prezesa NFZ",
    "Ustawy zdrowotne",
    "Komunikaty ZUS",
    "P1/P2/e-Zdrowie",
    "Twój nowy temat"  // <-- Dodaj tutaj
  ]
};
```

Zapisz plik i odśwież aplikację.

### 8.3 Aktywacja/deaktywacja źródeł

#### Przez interfejs (zalecane):
1. Zakładka **"Parametry API"**
2. Kliknij przełącznik przy źródle
3. Konfiguracja zapisze się automatycznie

#### Status przełącznika:
- **Czarny** (kółko po prawej) = źródło **aktywne**
- **Szary** (kółko po lewej) = źródło **nieaktywne**

#### Kiedy dezaktywować źródło?
- **ZUS** - jeśli nie interesują Cię składki
- **CEZ** - jeśli nie korzystasz z e-Recepty/e-Skierowania
- **NFZ Scraper** - jeśli nie jesteś kontrahentem NFZ
- **ISAP ELI** - raczej nie (to główne źródło ustaw)

## 9. Rozwiązywanie problemów

### 9.1 Błąd API

#### Komunikat:
```
Błąd systemu ingestii. Sprawdź dostępność API ELI, RSS lub mechanizmu Scrapingowego.
```

#### Przyczyny i rozwiązania:

**Problem 1: Brak klucza API**
- **Sprawdź**: Czy plik `.env.local` istnieje?
- **Sprawdź**: Czy klucz API jest poprawny?
- **Rozwiązanie**: Utwórz/popraw plik `.env.local`

**Problem 2: Nieprawidłowy klucz API**
- **Symptom**: Błąd 403 lub "API key not valid"
- **Rozwiązanie**: Wygeneruj nowy klucz na https://ai.google.dev/

**Problem 3: Limit API przekroczony**
- **Symptom**: Błąd 429 "Quota exceeded"
- **Rozwiązanie**: Poczekaj lub zwiększ limit na koncie Google

**Problem 4: Źródła niedostępne**
- **Symptom**: Timeout lub brak danych
- **Rozwiązanie**: 
  - Sprawdź połączenie internetowe
  - Sprawdź czy strony gov.pl są dostępne
  - Spróbuj później (może być przerwa techniczna)

### 9.2 Brak danych

#### Komunikat:
```
Brak nowych danych z ELI/RSS/SCRAPER
```

#### Przyczyny:

**Przyczyna 1: Brak aktualizacji w wybranym zakresie**
- **Rozwiązanie**: Zwiększ zakres czasowy (z 7d na 30d lub 90d)

**Przyczyna 2: Wszystkie źródła dezaktywowane**
- **Rozwiązanie**: Włącz przynajmniej jedno źródło w "Parametry API"

**Przyczyna 3: Tematy strategiczne zbyt wąskie**
- **Rozwiązanie**: To normalne - nie zawsze są nowe zarządzenia NFZ

**Przyczyna 4: Gemini nie znalazł dopasowań**
- **Rozwiązanie**: Spróbuj ponownie (kliknij inny zakres czasowy i wróć)

### 9.3 Problemy z połączeniem

#### Problem: "Failed to fetch"

**Krok 1: Sprawdź internet**
```bash
ping google.com
```

**Krok 2: Sprawdź czy Vite działa**
- Czy widzisz aplikację w przeglądarce?
- Czy console (F12) pokazuje błędy?

**Krok 3: Sprawdź firewall**
- Czy firewall blokuje port 5173?
- Czy antywirus blokuje Vite?

**Krok 4: Restartuj serwer dev**
```bash
# Ctrl+C aby zatrzymać
npm run dev  # Uruchom ponownie
```

#### Problem: "CORS error"

**Przyczyna**: Gemini AI API zwraca błąd CORS

**Rozwiązanie**:
- To problem po stronie Google - zazwyczaj przejściowy
- Spróbuj ponownie za 5-10 minut
- Sprawdź status API: https://status.cloud.google.com/

## 10. FAQ

### Najczęściej zadawane pytania

#### Q1: Czy dane są wysyłane gdzieś poza moją przeglądarkę?
**A**: Tak, wysyłane są do Google Gemini AI API w celu parsowania. Jednak:
- Archiwum jest **tylko lokalnie** (localStorage)
- Konfiguracja jest **tylko lokalnie**
- Google nie przechowuje danych długoterminowo (zgodnie z polityką API)

#### Q2: Czy mogę używać aplikacji offline?
**A**: Nie. Aplikacja wymaga połączenia z internetem aby:
- Pobrać dane ze źródeł gov.pl
- Wysłać zapytanie do Gemini AI
- Otrzymać sparsowane dane

#### Q3: Dlaczego system nie interpretuje aktów prawnych?
**A**: To celowy design. System jest **narzędziem dla profesjonalistów**, którzy sami dokonują interpretacji. Zero-AI Assessment zapewnia:
- Brak błędnych interpretacji AI
- Brak subiektywnych ocen
- Czystą faktografię 1:1 ze źródeł

#### Q4: Czy mogę eksportować archiwum?
**A**: Nie ma wbudowanej funkcji, ale możesz:
1. Otwórz DevTools (F12)
2. Console
3. Wpisz: `JSON.stringify(localStorage.getItem('zapisane_v13'))`
4. Skopiuj wynik
5. Zapisz do pliku .json

#### Q5: Czy mogę zmienić wygląd aplikacji?
**A**: Aplikacja używa Tailwind CSS inline. Możesz modyfikować klasy w plikach `.tsx`, ale wymaga to znajomości React i Tailwind.

#### Q6: Jak często aktualizują się źródła?
**A**: 
- **RSS (ZUS, CEZ)**: Real-time (minuty po publikacji)
- **ELI API (ISAP)**: Kilka razy dziennie
- **Scraper NFZ**: Przy publikacji nowego zarządzenia

#### Q7: Czy system obsługuje wszystkie akty prawne?
**A**: Nie. System monitoruje **tylko prawo medyczne i zdrowotne** z wybranych źródeł. Nie obejmuje np.:
- Prawa pracy (chyba że związane z ZUS)
- Prawa budowlanego
- Prawa karnego
- Aktów prawnych lokalnych (wojewódzkich)

#### Q8: Co zrobić jeśli raport jest za długi?
**A**: 
- Zaznacz mniej dokumentów przed generowaniem
- Generuj oddzielne raporty dla różnych okresów
- Kopiuj fragmenty raportu zamiast całości

#### Q9: Czy mogę udostępnić archiwum innemu użytkownikowi?
**A**: Nie bezpośrednio. Archiwum jest lokalne. Możesz:
- Wyeksportować JSON (patrz Q4)
- Wysłać JSON innemu użytkownikowi
- Tamta osoba może zaimportować JSON do localStorage

#### Q10: Czy system działa na telefonie/tablecie?
**A**: Teoretycznie tak (responsywny design z Tailwind), ale:
- **Zalecamy desktop** - lepsze UX dla prawników
- Tablet może być OK dla przeglądania
- Telefon - tylko do szybkiego sprawdzenia

#### Q11: Jak często powinienem sprawdzać system?
**A**: Zależy od roli:
- **Radca prawny**: Codziennie lub co 2-3 dni
- **Dyrektor**: Tydzień (z raportem od radcy)
- **Administrator e-Zdrowie**: Codziennie (komunikaty CEZ)
- **Dział NFZ**: Co tydzień (nowe zarządzenia)

#### Q12: Co to są "grounding links"?
**A**: To linki do źródeł użytych przez Gemini AI do wygenerowania odpowiedzi. Służą do:
- **Weryfikacji faktów**
- **Sprawdzenia** czy AI użył oficjalnych źródeł
- **Dostępu** do pełnych dokumentów

Kliknij na link w sekcji "Zweryfikowane Punkty Danych" aby otworzyć źródło.

---

## Wsparcie techniczne

Jeśli masz problemy:
1. Sprawdź tę dokumentację (sekcja 9 "Rozwiązywanie problemów")
2. Sprawdź logi w konsoli przeglądarki (F12 → Console)
3. Sprawdź czy `.env.local` jest poprawny
4. Restartuj aplikację (`Ctrl+C` i `npm run dev`)

---

**Wersja dokumentacji**: 1.0  
**Data ostatniej aktualizacji**: 2026-01-02  
**Kompatybilna z wersją aplikacji**: 1.3
