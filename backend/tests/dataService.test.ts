import { describe, it, expect, beforeAll } from 'vitest';
import { getData, getExport } from '../src/services/dataService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Upewnij się że baza jest gotowa
  await prisma.$connect();
});

describe('dataService - Testy jednostkowe', () => {
  describe('getData', () => {
    it('powinien zwrócić tablicę', async () => {
      const result = await getData('7d', 'eli');
      expect(Array.isArray(result)).toBe(true);
    });

    it('powinien zaakceptować range=30d', async () => {
      const result = await getData('30d', 'eli');
      expect(Array.isArray(result)).toBe(true);
    });

    it('powinien zaakceptować range=90d', async () => {
      const result = await getData('90d', 'rss');
      expect(Array.isArray(result)).toBe(true);
    });

    it('powinien zaakceptować method=scraper', async () => {
      const result = await getData('7d', 'scraper');
      expect(Array.isArray(result)).toBe(true);
    });

    it('powinien filtrować po dacie (7 dni)', async () => {
      const result = await getData('7d');
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      result.forEach(item => {
        const itemDate = new Date(item.date);
        expect(itemDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      });
    });

    it('powinien zwrócić dane bez filtrów', async () => {
      const result = await getData();
      expect(Array.isArray(result)).toBe(true);
    });

    it('zwrócone rekordy powinny mieć wymagane pola', async () => {
      const result = await getData('30d', 'eli');
      if (result.length > 0) {
        const record = result[0];
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('title');
        expect(record).toHaveProperty('date');
        expect(record).toHaveProperty('ingestMethod');
      }
    });
  });

  describe('getExport', () => {
    it('powinien wygenerować raport dla pustej tablicy', async () => {
      const result = await getExport([]);
      expect(typeof result).toBe('string');
    });

    it('powinien wygenerować raport dla niepoprawnych ID', async () => {
      const result = await getExport(['nieistniejace-id-123']);
      expect(typeof result).toBe('string');
    });

    it('powinien zawierać separatory w raporcie', async () => {
      const result = await getExport(['test-id']);
      expect(result).toContain('═');
    });
  });
});
