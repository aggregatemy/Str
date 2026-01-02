import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { scrapeELI, scrapeAllELI } from '../eliScraper.js';

vi.mock('axios');

describe('ELI Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scrapeELI', () => {
    it('powinien pobrać dane z API Sejmu', async () => {
      const mockData = {
        '@graph': [
          {
            '@id': '/eli/akt/2024/1',
            'eli:title': 'Testowa ustawa',
            'eli:description': 'Opis testowy',
            'eli:date_publication': '2024-01-01',
            'eli:type_document': 'ustawa',
            'eli:in_force': true
          }
        ]
      };

      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

      const results = await scrapeELI();

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        ingestMethod: 'eli',
        title: 'Testowa ustawa',
        impact: 'high', // ustawa = high impact
        category: 'ustawa'
      });
    });

    it('powinien obsłużyć błąd API', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

      const results = await scrapeELI();

      expect(results).toEqual([]);
    });

    it('powinien określić poprawny impact dla różnych typów', async () => {
      const mockData = {
        '@graph': [
          { '@id': '/1', 'eli:title': 'Ustawa', 'eli:type_document': 'ustawa', 'eli:date_publication': '2024-01-01' },
          { '@id': '/2', 'eli:title': 'Rozporządzenie', 'eli:type_document': 'rozporządzenie', 'eli:date_publication': '2024-01-01' },
          { '@id': '/3', 'eli:title': 'Obwieszczenie', 'eli:type_document': 'obwieszczenie', 'eli:date_publication': '2024-01-01' }
        ]
      };

      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });
      const results = await scrapeELI();

      expect(results[0].impact).toBe('high'); // ustawa
      expect(results[1].impact).toBe('medium'); // rozporządzenie
      expect(results[2].impact).toBe('low'); // obwieszczenie
    });
  });

  describe('scrapeAllELI', () => {
    it('powinien agregować dane z wielu źródeł', async () => {
      const mockData = {
        '@graph': [
          { '@id': '/test', 'eli:title': 'Test', 'eli:date_publication': '2024-01-01', 'eli:type_document': 'ustawa' }
        ]
      };
      
      vi.mocked(axios.get).mockResolvedValue({ data: mockData });

      const results = await scrapeAllELI();

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
