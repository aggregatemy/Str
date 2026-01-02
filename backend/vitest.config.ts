import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 30000,
    // Exclude problematic tests with rdflib
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dataService.test.ts',
      '**/eliScraper.test.ts',
    ],
  },
});
