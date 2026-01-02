import { describe, it, expect } from 'vitest';
import { scrapeRSS } from '../src/scrapers/rssScraper';

describe('rssScraper - Testy scrapera RSS', () => {
  it('powinien zwrócić tablicę dla ZUS', async () => {
    const result = await scrapeRSS('https://www.zus.pl/o-zus/aktualnosci', 'zus');
    expect(Array.isArray(result)).toBe(true);
  }, 15000);

  it('powinien obsłużyć niepoprawny URL', async () => {
    const result = await scrapeRSS('https://invalid-url-12345.com/rss', 'test');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  }, 15000);

  it('każdy rekord powinien mieć ingestMethod="rss"', async () => {
    const result = await scrapeRSS('https://www.zus.pl/o-zus/aktualnosci', 'zus');
    result.forEach(record => {
      expect(record.ingestMethod).toBe('rss');
    });
  }, 15000);
});
