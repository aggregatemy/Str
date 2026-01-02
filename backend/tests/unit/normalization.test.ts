import { NormalizationService } from '../../src/services/normalization';
import { LegalUpdate } from '../../src/types';

describe('NormalizationService', () => {
  let service: NormalizationService;

  beforeEach(() => {
    service = new NormalizationService();
  });

  describe('normalizeNFZData', () => {
    it('should normalize NFZ document data with direct mapping', async () => {
      const rawData = {
        Id: 12345,
        InstitutionId: 4,
        Title: 'Test Document',
        Subject: 'Test subject',
        Date: '2024-01-15',
        Type: 'Zarządzenie'
      };

      const result = await service.normalizeNFZData(rawData);

      expect(result).toHaveProperty('id', 'nfz-12345');
      expect(result).toHaveProperty('ingestMethod', 'scraper');
      expect(result).toHaveProperty('title', 'Test Document');
      expect(result).toHaveProperty('summary', 'Test subject');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('impact', 'medium');
      expect(result).toHaveProperty('category', 'Zarządzenie');
      expect(result).toHaveProperty('legalStatus', 'obowiązujący');
      expect(result).toHaveProperty('officialRationale', 'Test subject');
    });

    it('should handle missing fields with defaults', async () => {
      const rawData = {
        Id: 12345
      };

      const result = await service.normalizeNFZData(rawData);

      expect(result.id).toBe('nfz-12345');
      expect(result.ingestMethod).toBe('scraper');
      expect(result.title).toBeTruthy();
    });
  });

  describe('normalizeELIData', () => {
    it('should normalize ELI document data', async () => {
      const rawData = {
        id: 'eli-123',
        uri: 'http://isap.sejm.gov.pl/eli/test',
        title: 'Test Act',
        description: 'Test description',
        date: '2024-01-15',
        type: 'Ustawa',
        status: 'obowiązujący'
      };

      const result = await service.normalizeELIData(rawData);

      expect(result.id).toBe('eli-123');
      expect(result.eliUri).toBe('http://isap.sejm.gov.pl/eli/test');
      expect(result.ingestMethod).toBe('eli');
      expect(result.title).toBe('Test Act');
      expect(result.impact).toBe('high'); // Ustawa should be high impact
    });

    it('should determine correct impact from type', async () => {
      const ustawaData = { type: 'Ustawa', title: 'Test' };
      const rozporządzenie = { type: 'Rozporządzenie', title: 'Test' };
      const komunikat = { type: 'Komunikat', title: 'Test' };

      const result1 = await service.normalizeELIData(ustawaData);
      const result2 = await service.normalizeELIData(rozporządzenie);
      const result3 = await service.normalizeELIData(komunikat);

      expect(result1.impact).toBe('high');
      expect(result2.impact).toBe('medium');
      expect(result3.impact).toBe('low');
    });
  });

  describe('normalizeRSSData', () => {
    it('should normalize RSS item data', async () => {
      const rawData = {
        guid: 'rss-123',
        title: 'Test RSS Item',
        description: 'Test description',
        link: 'https://example.com/item',
        pubDate: 'Mon, 15 Jan 2024 10:00:00 GMT'
      };

      const result = await service.normalizeRSSData(rawData);

      expect(result.id).toBe('rss-123');
      expect(result.ingestMethod).toBe('rss');
      expect(result.title).toBe('Test RSS Item');
      expect(result.impact).toBe('low');
      expect(result.category).toBe('Komunikat');
    });

    it('should handle missing guid by using link', async () => {
      const rawData = {
        title: 'Test',
        link: 'https://example.com/item',
        pubDate: new Date().toISOString()
      };

      const result = await service.normalizeRSSData(rawData);

      expect(result.id).toContain('https');
    });
  });
});
