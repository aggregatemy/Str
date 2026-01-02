# Strażnik Prawa - Konfiguracja Środowiska Deweloperskiego

## 🔒 Izolacja Projektu

Ten projekt jest skonfigurowany do pracy **obok innych projektów** na tym samym komputerze bez konfliktów.

---

## 📌 Dedykowane Porty

| Komponent | Port | Konfiguracja |
|-----------|------|--------------|
| **Backend** | 5554 | `backend/src/server.ts` |
| **Frontend** | 5555 | `vite.config.ts` |

**Uwaga**: Jeśli inne projekty używają portów 5554/5555, zmień je w:
- Backend: `backend/.env` → `PORT=XXXX`
- Frontend: `vite.config.ts` → `server.port`

---

## 📁 Struktura Baz Danych

```
backend/
├── dev.db          # SQLite (lokalne dane, NIE commitowane)
├── .env            # Konfiguracja środowiska (NIE commitowana)
└── prisma/
    └── schema.prisma  # Schema bazy danych
```

**Baza danych jest lokalna** - każdy deweloper ma własną kopię w `backend/dev.db`.

---

## 🚀 Uruchomienie Projektu

### 1. Backend (Port 5554)

```bash
cd backend
npm install
npx prisma generate    # Generuj Prisma Client
npx prisma migrate dev # Stwórz bazę danych
npm run dev            # Uruchom backend
```

Backend będzie działać na: `http://localhost:5554`

### 2. Frontend (Port 5555)

```bash
cd ..  # Wróć do głównego katalogu
npm install
npm run dev
```

Frontend będzie działać na: `http://localhost:5555`

---

## 🔄 Mechanizm Pobierania Danych

### Zakres Czasowy
- **Początek**: 1 grudnia 2025
- **Koniec**: Bieżąca data (2 stycznia 2026)
- **Częstotliwość**: Co 1 minutę (serwer europejski)

### Źródła Danych

#### ELI (European Legislation Identifier)
**Klient A - Sejm RP** (JSON API):
- Dziennik Ustaw (DU) - grudzień 2025 + styczeń 2026
- Monitor Polski (MP) - grudzień 2025 + styczeń 2026
- Zakres: pozycje 1-100 na rok
- Rate limiting: 100ms

**Klient B - Ministerstwa** (XML API):
- 10 serwerów resortowych (MZ, MSWiA, MEN, MON, MKiDN, Klimat, UPRP, GUS, PGR, NBP)
- Grudzień 2025 + styczeń 2026
- Zakres: pozycje 1-50 na rok
- Rate limiting: 150ms

#### RSS
- ZUS Aktualności
- ZUS Wyjaśnienia Komórek Merytorycznych
- CEZ e-Zdrowie

#### Scrapers
- NFZ Baza Aktów Własnych (DevExpress)

---

## ⚙️ Konfiguracja `.env`

Plik `backend/.env` zawiera:

```env
# SQLite Database
DATABASE_URL="file:./dev.db"

# Porty (dedykowane dla Strażnika Prawa)
PORT=5554
FRONTEND_PORT=5555

# Zakres pobierania dokumentów
FETCH_DAYS=30
FETCH_START_DATE=2025-12-01
```

**Nie commituj pliku `.env`** - każdy deweloper może mieć inne porty/ścieżki.

---

## 🛡️ Izolacja od Innych Projektów

### Co jest ignorowane przez Git?

```
# SQLite databases
*.db
*.db-journal

# Environment variables
.env
.env.local

# Porty i PID
.port
*.pid
```

### Sprawdzenie Konfliktów Portów

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5554,5555 -ErrorAction SilentlyContinue
```

Jeśli porty są zajęte, zmień je w konfiguracji.

---

## 🧪 Testowanie

### Sprawdzenie Backendu
```bash
curl http://localhost:5554/api/v1/updates
```

### Sprawdzenie Frontendu
Otwórz: `http://localhost:5555`

### Sprawdzenie Bazy Danych
```bash
cd backend
npx prisma studio --port 5556
```

Prisma Studio: `http://localhost:5556`

---

## 📊 Monitorowanie

### Logi Backendu
Backend wyświetla w konsoli:
- `📡 Klient A (Sejm)` - Pobieranie z Sejmu
- `📡 Klient B (Resortowe)` - Pobieranie z Ministerstw
- `✅ [Źródło]: X dokumentów` - Liczba pobranych dokumentów
- `⏰ Scheduled refresh triggered` - Co 1 minutę

### Sprawdzenie Stanu Bazy
```bash
cd backend
sqlite3 dev.db "SELECT COUNT(*), ingestMethod FROM LegalFact GROUP BY ingestMethod;"
```

Przykładowy wynik:
```
10|rss
0|eli
```

---

## 🐛 Rozwiązywanie Problemów

### Port już zajęty
```
Error: listen EADDRINUSE: address already in use :::5554
```

**Rozwiązanie**: Zmień port w `backend/.env` na inny (np. 5560).

### Baza danych zablokowana
```
Error: database is locked
```

**Rozwiązanie**: Zamknij wszystkie procesy backendu:
```powershell
Get-Process -Name node | Stop-Process -Force
```

### Brak dokumentów z ELI
To normalne 2 stycznia 2026 - ministerstwa jeszcze nie opublikowały aktów w nowym roku.

---

## 🔧 Narzędzia Deweloperskie

- **tsx watch**: Hot reload backendu
- **Vite**: Hot reload frontendu
- **Prisma Studio**: GUI bazy danych
- **Axios**: HTTP client z timeout
- **Cheerio**: HTML scraping (NFZ)

---

## 📝 Uwagi dla Deweloperów

1. **Nie commituj** `dev.db`, `.env`, `*.log`
2. **Używaj dedykowanych portów** 5554/5555
3. **Scheduler co 1 minutę** - może generować dużo requestów
4. **Rate limiting aktywny** - 100ms/150ms delay między requestami
5. **Brute-force ELI** - iteracja przez pozycje aż do HTTP 404

---

## 📚 Dokumentacja Techniczna

- [COMPLETE_ELI_RSS_INTEGRATION.md](COMPLETE_ELI_RSS_INTEGRATION.md) - Pełna dokumentacja integracji
- [ELI_SERVERS_IMPLEMENTATION.md](ELI_SERVERS_IMPLEMENTATION.md) - Specyfikacja serwerów ELI
- [backend/README.md](backend/README.md) - Dokumentacja backendu

---

**Wersja**: 1.0.0  
**Data**: 2 stycznia 2026  
**Autor**: Strażnik Prawa Development Team
