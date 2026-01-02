import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { scrapeRSS } from '../rssScraper.js';

vi.mock('axios');

describe('RSS Scraper', () => {
  it('powinien sparsować feed RSS', async () => {
    const mockRSS = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Komunikat ZUS</title>
            <description>Opis zmiany</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            <link>https://www.zus.pl/test</link>
          </item>
        </channel>
      </rss>`;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockRSS });

    const results = await scrapeRSS('https://www.zus.pl/rss', 'zus');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ingestMethod: 'rss',
      title: 'Komunikat ZUS',
      category: 'ZUS',
      impact: 'medium'
    });
  });

  it('powinien obsłużyć niepoprawny XML', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: 'invalid xml' });

    const results = await scrapeRSS('https://invalid.url', 'test');

    expect(results).toEqual([]);
  });
});
