import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { scrapeNFZ } from '../nfzScraper.js';

vi.mock('axios');

describe('NFZ Scraper', () => {
  it('powinien wyciągnąć dane z tabeli HTML', async () => {
    const mockHTML = `
      <table>
        <tbody>
          <tr>
            <td>12/2024</td>
            <td><a href="/test">Zarządzenie testowe</a></td>
            <td>01.01.2024</td>
          </tr>
        </tbody>
      </table>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockHTML });

    const results = await scrapeNFZ();

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      ingestMethod: 'scraper',
      category: 'NFZ',
      date: '2024-01-01'
    });
  });

  it('powinien poprawnie parsować daty polskie', async () => {
    const mockHTML = `<table><tbody><tr>
      <td>1/2024</td><td>Test</td><td>31.12.2023</td>
    </tr></tbody></table>`;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockHTML });
    const results = await scrapeNFZ();

    expect(results[0].date).toBe('2023-12-31');
  });
});
