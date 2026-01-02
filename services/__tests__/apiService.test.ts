import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLegalUpdates, exportUpdates } from '../apiService';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchLegalUpdates', () => {
    it('powinien pobrać dane z API', async () => {
      const mockData = [
        {
          id: 'test-1',
          title: 'Test',
          ingestMethod: 'eli',
          date: '2024-01-01',
          impact: 'high',
          category: 'Prawo',
          summary: 'Test summary',
          legalStatus: 'in_force',
          officialRationale: 'Test rationale',
          sourceUrl: 'https://test.gov.pl',
          eliUri: '/eli/test/1'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await fetchLegalUpdates();

      expect(fetch).toHaveBeenCalledWith('/api/v1/updates?');
      expect(result).toEqual(mockData);
    });

    it('powinien dodać parametr range do URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await fetchLegalUpdates('7d');

      expect(fetch).toHaveBeenCalledWith('/api/v1/updates?range=7d');
    });

    it('powinien rzucić błąd przy nieudanym zapytaniu', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(fetchLegalUpdates()).rejects.toThrow('Błąd pobierania danych');
    });

    it('powinien obsłużyć błąd sieci', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchLegalUpdates()).rejects.toThrow('Network error');
    });

    it('powinien mapować pola odpowiedzi API', async () => {
      const mockApiData = [
        {
          id: 'test-1',
          title: 'Test Title',
          ingestMethod: 'rss',
          date: '2024-01-15',
          impact: 'medium',
          category: 'ZUS',
          summary: 'Test summary',
          legalStatus: 'published',
          officialRationale: 'Test rationale',
          sourceUrl: 'https://zus.pl',
          eliUri: null
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiData,
      } as Response);

      const result = await fetchLegalUpdates('30d');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-1',
        title: 'Test Title',
        ingestMethod: 'rss',
        date: '2024-01-15',
        impact: 'medium',
        category: 'ZUS',
        summary: 'Test summary',
        legalStatus: 'published',
        officialRationale: 'Test rationale',
        sourceUrl: 'https://zus.pl',
        eliUri: null
      });
    });
  });

  describe('exportUpdates', () => {
    it('powinien wysłać POST z ID dokumentów', async () => {
      const mockText = 'Exported content';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockText,
      } as Response);

      const result = await exportUpdates(['id-1', 'id-2']);

      expect(fetch).toHaveBeenCalledWith('/api/v1/export/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ['id-1', 'id-2'] })
      });

      expect(result).toBe(mockText);
    });

    it('powinien rzucić błąd przy nieudanym eksporcie', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(exportUpdates(['id-1'])).rejects.toThrow('Błąd eksportu');
    });

    it('powinien obsłużyć puste tablice ID', async () => {
      const mockText = 'Empty export';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => mockText,
      } as Response);

      const result = await exportUpdates([]);

      expect(fetch).toHaveBeenCalledWith('/api/v1/export/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] })
      });

      expect(result).toBe(mockText);
    });

    it('powinien obsłużyć błąd sieci przy eksporcie', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(exportUpdates(['id-1'])).rejects.toThrow('Network error');
    });
  });
});
