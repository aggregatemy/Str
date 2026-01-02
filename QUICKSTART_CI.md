# Quick Start Guide for CI/CD

## Overview
This repository now has a complete CI/CD pipeline that automates testing, building, and deployment.

## What Happens Automatically

### On Every Push or Pull Request
1. **Type Checking** - Validates TypeScript types
2. **Unit Tests** - Runs all tests in `__tests__/`
3. **Build** - Creates production build
4. **Integration Tests** - Runs E2E tests with Playwright

### On Pull Requests
- Automated code review checks
- PR comment with results
- Security vulnerability scanning

### On Merge to Main
- All CI checks
- Automatic deployment (when configured)

## Running Tests Locally

### Unit Tests
```bash
# Run all unit tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Open interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

## Adding New Tests

### Unit Tests
Create files in `__tests__/` with `.test.ts` or `.test.tsx` extension:

```typescript
import { describe, it, expect } from 'vitest';

describe('My Component', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### E2E Tests
Create files in `e2e/` with `.spec.ts` extension:

```typescript
import { test, expect } from '@playwright/test';

test('should work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Hello')).toBeVisible();
});
```

## Workflow Files

All workflows are in `.github/workflows/`:
- `ci.yml` - Main CI pipeline
- `pr-checks.yml` - PR-specific checks
- `unit-tests.yml` - Cross-version testing
- `build.yml` - Build validation
- `integration-tests.yml` - E2E testing
- `deploy.yml` - Deployment automation

## Configuration

### Environment Variables
Set these in GitHub Settings → Secrets and variables → Actions:
- `GEMINI_API_KEY` - For runtime (if needed in CI)
- `CUSTOM_DOMAIN` - For GitHub Pages deployment

### Playwright
Configuration: `playwright.config.ts`
- Runs tests against `http://localhost:4173`
- Uses Chromium browser
- Automatically starts preview server

### Vitest
Configuration: `vitest.config.ts`
- Uses jsdom environment
- Excludes `e2e/` directory
- Supports React testing

## Troubleshooting

### Tests Fail Locally but Pass in CI
- Check Node.js version (CI uses 20)
- Clear `node_modules` and reinstall
- Check for missing environment variables

### E2E Tests Fail
- Ensure build is up to date: `npm run build`
- Check if port 4173 is available
- Install Playwright browsers: `npx playwright install`

### Build Fails
- Run `npx tsc --noEmit` to check types
- Check for missing dependencies
- Clear build cache: `rm -rf dist`

## Next Steps

1. ✅ Tests are passing
2. ✅ CI/CD is configured
3. 🔄 Configure deployment target (Netlify, Vercel, etc.)
4. 🔄 Add more test coverage
5. 🔄 Set up branch protection rules

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Full CI/CD Documentation](.github/CICD_DOCUMENTATION.md)
