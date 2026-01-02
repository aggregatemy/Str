<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

![CI](https://github.com/aggregatemy/Str/workflows/CI/badge.svg)
![Build](https://github.com/aggregatemy/Str/workflows/Build/badge.svg)
![Unit Tests](https://github.com/aggregatemy/Str/workflows/Unit%20Tests/badge.svg)

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OWR-Jl8KYj7mr40To6jSOF_gavuc_Y7E

## 🎯 Weryfikacja Aplikacji - Wyświetlanie Aktów Prawnych

**Chcesz zobaczyć jakie akty prawa zostały wydane w tym miesiącu?**

Aplikacja pobiera dane z oficjalnych źródeł:
- 🏛️ **ISAP ELI** - Internetowy System Aktów Prawnych (isap.sejm.gov.pl)
- 📋 **ZUS** - Zakład Ubezpieczeń Społecznych (zus.pl)
- 📄 **CEZ** - Centrum Elektronicznych Zasobów (cez.gov.pl)
- 🏥 **NFZ** - Narodowy Fundusz Zdrowia (nfz.gov.pl)

### Szybka Weryfikacja

```bash
# Uruchom pełną weryfikację aplikacji
./verify-app.sh
```

Lub zobacz szczegółową dokumentację: **[WERYFIKACJA_APLIKACJI.md](WERYFIKACJA_APLIKACJI.md)**

### Jak Zobaczyć Akty z Tego Miesiąca

1. Skonfiguruj klucz API w `.env.local`:
   ```bash
   GEMINI_API_KEY=twój_klucz_api
   ```

2. Uruchom aplikację:
   ```bash
   npm run dev
   ```

3. Otwórz w przeglądarce `http://localhost:3000`

4. Kliknij przycisk **"30 dni"** aby zobaczyć akty z bieżącego miesiąca

Aplikacja automatycznie pobierze i wyświetli:
- Zarządzenia Prezesa NFZ
- Ustawy zdrowotne z ISAP
- Komunikaty ZUS
- Inne akty medyczne

**Wszystkie dane pochodzą z oficjalnych portali .gov.pl - są w 100% weryfikowalne!**

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Testing

This project includes comprehensive testing infrastructure:

### Unit Tests
Run unit tests with Vitest:
```bash
npm test                  # Run tests once
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Generate coverage report
```

### Integration/E2E Tests
Run end-to-end tests with Playwright:
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Open Playwright UI
npm run test:e2e:debug    # Debug E2E tests
```

### Verification Tests
Run comprehensive verification tests:
```bash
# Test that verifies the app can display legal acts
npm run test:e2e -- legal-updates-verification.spec.ts
```

## CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and deployment. The pipeline includes:

- **Code Review Automation**: Automated checks on pull requests
- **Unit Testing**: Runs tests on multiple Node.js versions (18, 20)
- **Build Process**: Ensures the application builds successfully
- **Integration Tests**: Runs E2E tests with Playwright
- **Deployment**: Automatic deployment to configured environments

For detailed documentation, see [CI/CD Documentation](.github/CICD_DOCUMENTATION.md).

### Workflows

- **CI** - Runs on every push and PR (linting, type checking, testing, building)
- **Pull Request Checks** - Automated code review on PRs
- **Unit Tests** - Cross-version testing
- **Build** - Production build validation
- **Integration Tests** - E2E testing with Playwright
- **Deploy** - Automatic deployment on merge to main

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```
