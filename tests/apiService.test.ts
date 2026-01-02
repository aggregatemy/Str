import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLegalUpdates, exportUpdates } from '../services/apiService';

// Mock globalnego fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('apiService - Frontend API client', () => {
  describe('fetchLegalUpdates', () => {
    it('powinien wysłać GET request do /api/v1/updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      } as Response);

      await fetchLegalUpdates();

      // fetch jest wywoływany z URLSearchParams, więc drugi argument to obiekt, nie undefined
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/v1/updates');
    });

    it('powinien dodać parametr range do URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await fetchLegalUpdates('30d');
      
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('range=30d');
    });

    it('powinien rzucić błąd przy 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(fetchLegalUpdates()).rejects.toThrow('Endpoint API nie istnieje');
    });

    it('powinien obsłużyć timeout', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 20000))
      );

      await expect(fetchLegalUpdates()).rejects.toThrow('Timeout');
    }, 20000);
  });

  describe('exportUpdates', () => {
    it('powinien wysłać POST request z tablicą ids', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Mock report'
      });

      await exportUpdates(['id1', 'id2']);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/export/extract'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids: ['id1', 'id2'] })
        })
      );
    });

    it('powinien rzucić błąd dla pustej tablicy ids', async () => {
      await expect(exportUpdates([])).rejects.toThrow('Brak wybranych dokumentów');
    });

    it('powinien obsłużyć błąd 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(exportUpdates(['id1'])).rejects.toThrow('Nieprawidłowe żądanie');
    });
  });
});
