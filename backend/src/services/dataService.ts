import { LegalFact } from '../types/index.js';
import { scrapeELI } from '../scrapers/eliScraper.js';
import { scrapeAllRSS } from '../scrapers/rssScraper.js';
import { scrapeNFZ } from '../scrapers/nfzScraper.js';
import { scrapeGUS } from '../scrapers/gusScraper.js';

let cachedData: LegalFact[] = [];
let lastUpdate: Date | null = null;

export async function refreshData(): Promise<void> {
  console.log('🔄 Odświeżanie danych z wszystkich źródeł...');
  const startTime = Date.now();
  
  const [eli, rssFeeds, nfz, gus] = await Promise.allSettled([
    scrapeELI(),
    scrapeAllRSS(),
    scrapeNFZ(),
    scrapeGUS()
  ]);

  // Zbierz wyniki (ignoruj błędy)
  const allResults: LegalFact[] = [];
  
  if (eli.status === 'fulfilled') allResults.push(...eli.value);
  if (rssFeeds.status === 'fulfilled') allResults.push(...rssFeeds.value);
  if (nfz.status === 'fulfilled') allResults.push(...nfz.value);
  if (gus.status === 'fulfilled') allResults.push(...gus.value);

  // Deduplikacja po ID
  const uniqueMap = new Map<string, LegalFact>();
  allResults.forEach(fact => uniqueMap.set(fact.id, fact));
  
  cachedData = Array.from(uniqueMap.values());
  lastUpdate = new Date();
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Odświeżono ${cachedData.length} unikalnych rekordów w ${elapsed}s`);
  console.log(`   - ELI: ${eli.status === 'fulfilled' ? eli.value.length : 0}`);
  console.log(`   - RSS: ${rssFeeds.status === 'fulfilled' ? rssFeeds.value.length : 0}`);
  console.log(`   - NFZ: ${nfz.status === 'fulfilled' ? nfz.value.length : 0}`);
  console.log(`   - GUS: ${gus.status === 'fulfilled' ? gus.value.length : 0}`);
}

export function getData(range?: string, method?: string): LegalFact[] {
  let filtered = [...cachedData];

  // Filtrowanie po dacie
  if (range) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    filtered = filtered.filter(f => new Date(f.date) >= cutoffDate);
  }

  // Filtrowanie po metodzie
  if (method) {
    filtered = filtered.filter(f => f.ingestMethod === method);
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getStats() {
  return {
    total: cachedData.length,
    lastUpdate: lastUpdate?.toISOString(),
    byMethod: {
      eli: cachedData.filter(f => f.ingestMethod === 'eli').length,
      rss: cachedData.filter(f => f.ingestMethod === 'rss').length,
      scraper: cachedData.filter(f => f.ingestMethod === 'scraper').length
    },
    byImpact: {
      high: cachedData.filter(f => f.impact === 'high').length,
      medium: cachedData.filter(f => f.impact === 'medium').length,
      low: cachedData.filter(f => f.impact === 'low').length
    }
  };
}

export function getExport(ids: string[]): string {
  const selected = cachedData.filter(f => ids.includes(f.id));
  return selected.map(f => `
═══════════════════════════════════════
${f.title}
Data: ${f.date} | Źródło: ${f.ingestMethod.toUpperCase()} | Kategoria: ${f.category}
───────────────────────────────────────
${f.summary}

${f.officialRationale ? `Uzasadnienie:\n${f.officialRationale}\n` : ''}
Link: ${f.sourceUrl}
═══════════════════════════════════════
  `).join('\n\n');
}
