# Atrybuty i licencje

## NFZ Scraper

Implementacja scrapera NFZ w tym projekcie jest oparta na projekcie:

**Projekt**: NFZ BAW Scrapper  
**Autor**: Franek Łopuszański (Frankoslaw)  
**Repository**: https://github.com/Frankoslaw/nfz-baw-scrapper  
**Licencja**: Bez określonej licencji (użyto za zgodą dobrego użycia)

### Adaptacja

Oryginalny kod Pythonowy został zaadaptowany do TypeScript/Node.js z następującymi zmianami:

- Przepisanie z Python na TypeScript
- Integracja z Express.js API
- Dodanie cron job dla automatyzacji
- Rozszerzenie o normalizację Gemini
- Dodanie warstwy storage (SQLite)
- Implementacja cache HTTP z axios-cache-interceptor
- Dodanie systemu logowania z Winston
- Rozbudowana obsługa błędów

### Wspólne elementy

Następujące elementy zostały zachowane z oryginalnego projektu:

1. **Struktura API NFZ BAW**: Endpointy i parametry zapytań
2. **Mechanizm pobierania dokumentów**: Metoda GetDocumentsNewGrid
3. **Pobieranie szczegółów**: Endpoint /documents/{institutionId}/details/{documentId}/null
4. **Pobieranie załączników**: Rozróżnienie między GetAttachment i GetZipxAttachment

### Podziękowania

Dziękujemy Frankowi Łopuszańskiemu za udostępnienie implementacji referencyjnej, która znacząco ułatwiła integrację z API NFZ BAW. Jego praca była kluczowa w zrozumieniu struktury danych i endpointów API.

## Inne zależności

Projekt wykorzystuje następujące biblioteki open source:

- **Express.js** - MIT License
- **TypeScript** - Apache License 2.0
- **Axios** - MIT License
- **Better-SQLite3** - MIT License
- **Winston** - MIT License
- **Node-Cron** - ISC License
- **Google Generative AI SDK** - Apache License 2.0

Pełna lista zależności znajduje się w pliku `package.json`.
