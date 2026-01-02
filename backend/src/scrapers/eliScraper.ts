import axios from 'axios';
import { LegalFact } from '../types/index.js';
import { SOURCES } from '../config/sources.js';

/**
 * Scraper for ELI API (ISAP)
 */
export async function scrapeELI(): Promise<LegalFact[]> {
  try {
    console.log('⚖️  Scraping ELI API...');
    
    const response = await axios.get(SOURCES.ELI, {
      timeout: 20000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; StraznikPrawa/1.0)'
      },
      params: {
        limit: 50,
        sort: '-date'
      }
    });

    const facts: LegalFact[] = [];
    const items = response.data?.items || response.data || [];
    const itemsArray = Array.isArray(items) ? items : [items];

    for (const item of itemsArray) {
      try {
        const eliUri = item.eli || item['@id'] || item.id;
        const title = item.title || item.name || 'Brak tytułu';
        const date = item.date || item.publicationDate || new Date().toISOString().split('T')[0];
        
        facts.push({
          id: `eli-${sanitizeId(eliUri || Date.now().toString())}`,
          ingestMethod: 'eli',
          eliUri: eliUri || null,
          title: title,
          summary: item.description || item.summary || title,
          date: normalizeDate(date),
          impact: 'high',
          category: item.type || 'ELI',
          legalStatus: 'published',
          officialRationale: item.justification || item.description || 'Brak uzasadnienia',
          sourceUrl: item.url || eliUri || SOURCES.ELI
        });
      } catch (itemError) {
        console.error('Error parsing ELI item:', itemError);
      }
    }

    console.log(`✅ ELI: ${facts.length} acts`);
    return facts;
  } catch (error) {
    console.error('❌ ELI Scraper Error:', error);
    return [];
  }
}

function sanitizeId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
