# Funkcja Kalendarza Zmian Prawa

Nowa funkcjonalność pozwala użytkownikom na filtrowanie aktów prawnych po konkretnej dacie publikacji/zmiany.

## Jak to działa?
1.  **Panel Boczny**: W panelu bocznym aplikacji znajduje się interaktywny kalendarz (`CalendarView`).
2.  **Wybór Daty**: Kliknięcie w konkretny dzień powoduje odświeżenie listy dokumentów, pokazując tylko te z wybranej daty.
3.  **Wizualizacja**: Dni, w których wystąpiły zmiany prawne, mogą być podświetlone (zależnie od danych w widoku).
4.  **Resetowanie**: Przycisk "Wyczyść datę" pozwala na powrót do widoku domyślnego (zakres czasowy).

## Implementacja Techniczna

### Komponenty
*   `components/CalendarView.tsx`: Wrapper na bibliotekę `react-calendar`. Obsługuje wyświetlanie i logikę wyboru.
*   `services/apiService.ts`: Zaktualizowana funkcja `fetchLegalUpdates` obsługuje parametr `date`.
*   `backend/src/services/dataService.ts`: Logika backendowa filtrująca rekordy po kolumnie `date` w bazie danych.

### API
Endpoint `/api/v1/updates` obsługuje parametr query `date` w formacie `YYYY-MM-DD`.
Przykład: `GET /api/v1/updates?date=2025-01-02`

## Testowanie
*   **Unit**: `tests/CalendarView.test.tsx`
*   **Backend**: `backend/tests/date-filter.test.ts`
*   **E2E**: `tests/e2e/calendar-flow.spec.ts`
