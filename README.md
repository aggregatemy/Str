<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Strażnik Prawa Medycznego

**System monitorowania zmian prawnych z oficjalnych źródeł polskich instytucji**

Strażnik Prawa Medycznego to zaawansowana aplikacja React + TypeScript służąca do automatycznego monitorowania, agregacji i analizy zmian prawnych z oficjalnych źródeł administracji publicznej w zakresie prawa medycznego i zdrowotnego. System zapewnia faktograficzną ingestię danych bez interpretacji, wykorzystując protokoły API, strumienie RSS oraz mechanizmy scrapingowe.

## 🎯 Funkcje kluczowe

- **Automatyczna agregacja danych** z 5 oficjalnych źródeł państwowych
- **Zero-AI Assessment** - brak interpretacji, czysta faktografia
- **Protokół ELI API** - integracja z systemem ISAP (Internetowy System Aktów Prawnych)
- **Strumienie RSS** - monitoring ZUS, CEZ, e-Zdrowie w czasie rzeczywistym
- **Backendowy scraper NFZ** - ekstrakcja zarządzeń Prezesa NFZ
- **Archiwizacja dokumentów** - lokalne przechowywanie ważnych aktów
- **Generowanie raportów faktograficznych** - wyciągi do dalszego wykorzystania
- **Filtrowanie czasowe** - zakres 7, 30 lub 90 dni
- **Grounding links** - weryfikacja źródeł danych

## 🏗️ Architektura systemu

### Źródła danych

System agreguje dane z następujących oficjalnych źródeł:

1. **ISAP ELI (European Legislation Identifier)**
   - Metoda: System API
   - URL: `https://isap.sejm.gov.pl/api/eli`
   - Typ danych: Akty prawne z ustrukturyzowanymi metadanymi ELI
   - Status prawny, numery ELI URI, oficjalne uzasadnienia

2. **ZUS (Zakład Ubezpieczeń Społecznych)**
   - Metoda: Strumień RSS
   - URL: `https://www.zus.pl/rss`
   - Typ danych: Komunikaty, zarządzenia, zmiany w przepisach ZUS

3. **CEZ (Centrum e-Zdrowia)**
   - Metoda: Strumień RSS
   - URL: `https://cez.gov.pl/rss`
   - Typ danych: Aktualizacje systemów e-zdrowia, komunikaty techniczne

4. **NFZ (Narodowy Fundusz Zdrowia)**
   - Metoda: Backendowy Scraper
   - URL: `https://www.nfz.gov.pl/zarzadzenia-prezesa/`
   - Typ danych: Zarządzenia Prezesa NFZ, tabele HTML

5. **e-Zdrowie**
   - Metoda: Strumień RSS
   - Typ danych: Komunikaty dotyczące platform P1/P2 oraz innych systemów e-Zdrowie

### Przepływ danych

```
[Źródła gov.pl] → [Gemini AI Parser] → [Normalizacja JSON] → [Frontend React] → [localStorage]
                         ↓
                  [Grounding Metadata]
```

## 📋 Wymagania wstępne

- **Node.js** w wersji 18.x lub nowszej
- **npm** (Node Package Manager)
- **Klucz API Google Gemini** - wymagany do parsowania danych
  - Uzyskaj klucz na: https://ai.google.dev/

## 🚀 Instalacja

### Krok 1: Sklonuj repozytorium

```bash
git clone https://github.com/aggregatemy/Str.git
cd Str
```

### Krok 2: Zainstaluj zależności

```bash
npm install
```

### Krok 3: Konfiguracja klucza API

Utwórz plik `.env.local` w katalogu głównym projektu:

```bash
touch .env.local
```

Dodaj do pliku `.env.local` swój klucz API Gemini:

```env
GEMINI_API_KEY=twoj_klucz_api_gemini
```

⚠️ **UWAGA**: Plik `.env.local` jest w `.gitignore` i nie zostanie commitowany do repozytorium.

### Krok 4: Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5173`

## 🔧 Konfiguracja

### Zmienne środowiskowe

| Zmienna | Opis | Wymagana |
|---------|------|----------|
| `GEMINI_API_KEY` | Klucz API Google Gemini do parsowania danych | ✅ Tak |

### Konfiguracja źródeł

Źródła danych można aktywować/deaktywować w interfejsie aplikacji:
1. Przejdź do zakładki **"Parametry API"**
2. Użyj przełączników przy każdym źródle
3. Konfiguracja jest zapisywana w `localStorage`

## 📁 Struktura projektu

```
Str/
├── App.tsx                          # Główny komponent aplikacji
├── index.tsx                        # Punkt wejścia React
├── types.ts                         # Definicje typów TypeScript
├── components/
│   └── UpdateCard.tsx              # Komponent wyświetlania aktualizacji prawnych
├── services/
│   └── geminiService.ts            # Serwis komunikacji z Gemini AI API
├── index.html                       # Główny plik HTML
├── vite.config.ts                   # Konfiguracja Vite
├── tsconfig.json                    # Konfiguracja TypeScript
├── package.json                     # Zależności projektu
├── metadata.json                    # Metadane projektu
├── openapi.yaml                     # Specyfikacja API (dokumentacja)
├── DOKUMENTACJA_UZYTKOWNIKA.md     # Szczegółowa dokumentacja użytkownika
├── DOKUMENTACJA_TESTOW.md          # Dokumentacja testów i CI/CD
├── DOKUMENTACJA_ZAPLECZA.md        # Dokumentacja backendu
└── README.md                        # Ten plik
```

### Opis kluczowych plików

- **App.tsx** (192 linie) - Główna logika aplikacji, zarządzanie stanem, komunikacja z API
- **types.ts** (43 linie) - Interfejsy TypeScript dla całego systemu
- **geminiService.ts** (91 linii) - Integracja z Gemini AI, parsowanie odpowiedzi
- **UpdateCard.tsx** (152 linie) - Komponenty UI do wyświetlania kart aktualizacji

## 🛠️ Stack technologiczny

### Frontend
- **React 19.2.3** - Biblioteka UI
- **TypeScript** - Typowanie statyczne
- **Vite** - Build tool i dev server
- **Tailwind CSS** - Stylowanie (inline classes)

### Backend/API
- **Google Gemini AI** - Parsowanie i normalizacja danych (`gemini-3-pro-preview`)
- **@google/genai 1.34.0** - SDK do komunikacji z Gemini

### Narzędzia deweloperskie
- **Vite** - Szybki build i HMR (Hot Module Replacement)
- **TypeScript Compiler** - Sprawdzanie typów

## 📚 Dodatkowa dokumentacja

- **[DOKUMENTACJA_UZYTKOWNIKA.md](./DOKUMENTACJA_UZYTKOWNIKA.md)** - Szczegółowy przewodnik użytkownika
- **[DOKUMENTACJA_TESTOW.md](./DOKUMENTACJA_TESTOW.md)** - Informacje o testach i CI/CD
- **[DOKUMENTACJA_ZAPLECZA.md](./DOKUMENTACJA_ZAPLECZA.md)** - Dokumentacja architektury backendu

## 🔗 Linki

- **AI Studio**: https://ai.studio/apps/drive/1OWR-Jl8KYj7mr40To6jSOF_gavuc_Y7E
- **Repozytorium**: https://github.com/aggregatemy/Str
- **Google Gemini API**: https://ai.google.dev/

## 📦 Dostępne komendy

```bash
# Uruchomienie serwera deweloperskiego
npm run dev

# Build produkcyjny
npm run build

# Podgląd buildu produkcyjnego
npm run preview
```

## 🔒 Bezpieczeństwo

- ✅ Klucze API przechowywane w zmiennych środowiskowych
- ✅ TypeScript strict mode aktywny
- ✅ Brak podatności w pakietach npm (audyt bezpieczeństwa)
- ✅ Grounding tylko na domeny `.gov.pl`, `.zus.pl`, `.nfz.gov.pl`

## 🤝 Współpraca

Projekt wykorzystuje system pull requestów. Każda zmiana przechodzi przez:
- Sprawdzenie TypeScript
- Build verification
- Code review

## 📄 Licencja

Projekt stworzony jako narzędzie wspomagające pracę z prawem medycznym w Polsce.

## 👥 Autorzy

Projekt rozwijany z wykorzystaniem Google AI Studio.

---

**Wersja**: 1.3  
**Ostatnia aktualizacja**: 2026-01-02
