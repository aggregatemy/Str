import { describe, it, expect } from 'vitest';
import { scrapeAllELI } from '../src/scrapers/eliScraper';

describe('eliScraper - Testy scrapera ELI', () => {
  it('powinien zwrócić tablicę', async () => {
    const result = await scrapeAllELI();
    expect(Array.isArray(result)).toBe(true);
  }, 30000); // 30s timeout dla długiego scrapingu

  it('wynik nie powinien być null ani undefined', async () => {
    const result = await scrapeAllELI();
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  }, 30000);

  it('każdy rekord powinien mieć wymagane pola', async () => {
    const result = await scrapeAllELI();
    if (result.length > 0) {
      const record = result[0];
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('title');
      expect(record).toHaveProperty('date');
      expect(record.ingestMethod).toBe('eli');
    }
  }, 30000);
});
