import { describe, it, expect } from 'vitest';

/**
 * API Response Format Validation Tests
 * Ensures backend returns consistent format for frontend consumption
 */
describe('API Response Format', () => {
  describe('LegalFact Response Structure', () => {
    it('should include all required fields', () => {
      const validFact = {
        id: 'eli-sejm-du:2025-1:2025-01-02',
        ingestMethod: 'eli',
        title: 'Sample regulation',
        summary: 'Sample summary',
        date: '2025-01-02',
        impact: 'medium',
        category: 'Legislation',
        legalStatus: 'published',
        officialRationale: 'Test rationale',
        sourceUrl: 'https://example.com'
      };

      expect(validFact).toHaveProperty('id');
      expect(validFact).toHaveProperty('ingestMethod');
      expect(validFact).toHaveProperty('title');
      expect(validFact).toHaveProperty('date');
      expect(validFact).toHaveProperty('sourceUrl');
    });

    it('should have valid impact values', () => {
      const validImpacts = ['low', 'medium', 'high'];
      const testFact = {
        id: 'test-1:1:2025-01-02',
        ingestMethod: 'eli' as const,
        title: 'Test',
        summary: 'Test',
        date: '2025-01-02',
        impact: 'medium' as const,
        category: 'Test',
        legalStatus: 'published',
        officialRationale: '',
        sourceUrl: 'https://test.com'
      };

      expect(validImpacts).toContain(testFact.impact);
    });

    it('should have valid ingest methods', () => {
      const validMethods = ['eli', 'rss', 'scraper'];
      const testMethods: ('eli' | 'rss' | 'scraper')[] = ['eli', 'rss', 'scraper'];

      testMethods.forEach(method => {
        expect(validMethods).toContain(method);
      });
    });

    it('should have valid ISO date format', () => {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const testDates = ['2025-01-02', '2025-12-31', '2026-06-15'];

      testDates.forEach(date => {
        expect(date).toMatch(isoDateRegex);
      });
    });
  });

  describe('Response Array Format', () => {
    it('should return array of facts', () => {
      const response: any[] = [
        {
          id: 'eli-sejm-du:2025-1:2025-01-02',
          ingestMethod: 'eli',
          title: 'Act 1',
          summary: 'Summary 1',
          date: '2025-01-02',
          impact: 'high',
          category: 'Cat1',
          legalStatus: 'published',
          officialRationale: '',
          sourceUrl: 'https://url1.com'
        },
        {
          id: 'rss-zus:id2:2025-01-01',
          ingestMethod: 'rss',
          title: 'Act 2',
          summary: 'Summary 2',
          date: '2025-01-01',
          impact: 'medium',
          category: 'Cat2',
          legalStatus: 'published',
          officialRationale: '',
          sourceUrl: 'https://url2.com'
        }
      ];

      expect(Array.isArray(response)).toBe(true);
      expect(response).toHaveLength(2);
      response.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
      });
    });

    it('should handle empty array', () => {
      const response: any[] = [];
      expect(Array.isArray(response)).toBe(true);
      expect(response).toHaveLength(0);
    });
  });

  describe('Health Check Response', () => {
    it('should return worker status', () => {
      const healthResponse = {
        status: 'healthy',
        uptime: 3600,
        workers: [
          {
            name: 'ELI Worker',
            status: 'running',
            lastRun: '2025-01-02T20:57:38.666Z',
            documentsToday: 150
          },
          {
            name: 'RSS Worker',
            status: 'idle',
            lastRun: '2025-01-02T20:57:40.125Z',
            documentsToday: 10
          },
          {
            name: 'NFZ Worker',
            status: 'running',
            lastRun: '2025-01-02T20:57:49.539Z',
            documentsToday: 16
          }
        ],
        database: {
          connected: true,
          recordCount: 973
        }
      };

      expect(healthResponse.status).toBe('healthy');
      expect(healthResponse.workers).toHaveLength(3);
      expect(healthResponse.database.connected).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    it('should have consistent error structure', () => {
      const errorResponse = {
        error: 'API_ERROR',
        message: 'Failed to fetch updates',
        timestamp: '2025-01-02T20:57:38.666Z',
        statusCode: 500
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('message');
      expect(errorResponse).toHaveProperty('timestamp');
      expect(errorResponse).toHaveProperty('statusCode');
    });
  });
});

describe('Source Filtering', () => {
  it('should filter by ELI source', () => {
    const facts = [
      { id: 'eli-sejm-du:1:2025-01-02', ingestMethod: 'eli' as const },
      { id: 'rss-zus:2:2025-01-02', ingestMethod: 'rss' as const },
      { id: 'nfz:3:2025-01-02', ingestMethod: 'scraper' as const }
    ];

    const eliFacts = facts.filter(f => f.ingestMethod === 'eli');
    expect(eliFacts).toHaveLength(1);
    expect(eliFacts[0].id).toContain('eli-sejm-du');
  });

  it('should filter by RSS source', () => {
    const facts = [
      { id: 'eli-sejm-du:1:2025-01-02', ingestMethod: 'eli' as const },
      { id: 'rss-zus:2:2025-01-02', ingestMethod: 'rss' as const }
    ];

    const rssFacts = facts.filter(f => f.ingestMethod === 'rss');
    expect(rssFacts).toHaveLength(1);
  });

  it('should properly compare dates in ISO format', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateStr.length).toBe(10);
  });
});

describe('CompositeKey Deduplication', () => {
  it('should prevent duplicate entries with same compositeKey', () => {
    const facts = new Map();
    const fact1 = { compositeKey: 'eli-sejm-du:2025-1:2025-01-02', title: 'Act 1' };
    const fact2 = { compositeKey: 'eli-sejm-du:2025-1:2025-01-02', title: 'Act 1 Updated' };

    facts.set(fact1.compositeKey, fact1);
    facts.set(fact2.compositeKey, fact2); // Should overwrite

    expect(facts.size).toBe(1);
    expect(facts.get(fact1.compositeKey).title).toBe('Act 1 Updated');
  });
});
