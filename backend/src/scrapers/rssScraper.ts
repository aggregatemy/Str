import axios from 'axios';
import xml2js from 'xml2js';
import { LegalFact } from '../types/index.js';

export async function scrapeRSS(url: string, source: string): Promise<LegalFact[]> {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const items = result.rss?.channel?.[0]?.item || [];
    const facts: LegalFact[] = [];

    for (const item of items) {
      facts.push({
        id: `rss-${source}-${Date.now()}-${Math.random()}`,
        ingestMethod: 'rss',
        eliUri: null,
        title: item.title?.[0] || 'Brak tytułu',
        summary: item.description?.[0] || '',
        date: new Date(item.pubDate?.[0]).toISOString().split('T')[0],
        impact: 'medium',
        category: source.toUpperCase(),
        legalStatus: 'published',
        officialRationale: item.description?.[0] || '',
        sourceUrl: item.link?.[0] || url
      });
    }

    return facts;
  } catch (error) {
    console.error(`❌ RSS Scraper Error (${source}):`, error);
    return [];
  }
}
