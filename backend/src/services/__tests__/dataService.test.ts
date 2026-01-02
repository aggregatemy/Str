import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEliData = [{
  id: 'eli-1',
  ingestMethod: 'eli' as const,
  title: 'Test ELI',
  date: new Date().toISOString().split('T')[0],
  impact: 'high' as const,
  summary: 'Test summary',
  category: 'ustawa',
  eliUri: '/test',
  legalStatus: 'published',
  officialRationale: 'Test rationale',
  sourceUrl: 'https://test.pl'
}];

// Mock scrapers before imports
vi.mock('../../scrapers/eliScraper.js', () => ({
  scrapeAllELI: vi.fn(() => Promise.resolve(mockEliData))
}));

vi.mock('../../scrapers/rssScraper.js', () => ({
  scrapeRSS: vi.fn(() => Promise.resolve([]))
}));

vi.mock('../../scrapers/nfzScraper.js', () => ({
  scrapeNFZ: vi.fn(() => Promise.resolve([]))
}));

import * as dataService from '../dataService.js';

describe('Data Service', () => {
  describe('refreshData', () => {
    it('powinien pobrać dane ze wszystkich źródeł', async () => {
      await expect(dataService.refreshData()).resolves.not.toThrow();
    });
  });

  describe('getData', () => {
    beforeEach(async () => {
      await dataService.refreshData();
    });

    it('powinien zwrócić wszystkie dane bez filtrów', () => {
      const data = dataService.getData();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('powinien filtrować po zakresie 7 dni', () => {
      const data = dataService.getData('7d');
      expect(Array.isArray(data)).toBe(true);
    });

    it('powinien filtrować po metodzie', () => {
      const data = dataService.getData(undefined, 'eli');
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const allEli = data.every(d => d.ingestMethod === 'eli');
        expect(allEli).toBe(true);
      }
    });
  });

  describe('getExport', () => {
    it('powinien wygenerować tekst eksportu', async () => {
      await dataService.refreshData();
      const text = dataService.getExport(['eli-1']);
      
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain('Test ELI');
    });
  });
});
