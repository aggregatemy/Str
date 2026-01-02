import { LegalFact } from '../types/index.js';
import { scrapeAllELI } from '../scrapers/eliScraper.js';
import { scrapeRSS } from '../scrapers/rssScraper.js';
import { scrapeNFZ } from '../scrapers/nfzScraper.js';

let cachedData: LegalFact[] = [];
let lastUpdate: Date | null = null;

export async function refreshData(): Promise<void> {
  console.log('🔄 Odświeżanie danych z wszystkich źródeł...');
  const startTime = Date.now();
  
  const [eli, zusRss, nfz] = await Promise.allSettled([
    scrapeAllELI(),      // ZMIANA: teraz pobiera ze WSZYSTKICH źródeł ELI
    scrapeRSS('https://www.zus.pl/rss/akty-prawne', 'zus'),
    scrapeNFZ()
  ]);

  const eliData = eli.status === 'fulfilled' ? eli.value : [];
  const zusData = zusRss.status === 'fulfilled' ? zusRss.value : [];
  const nfzData = nfz.status === 'fulfilled' ? nfz.value : [];

  cachedData = [...eliData, ...zusData, ...nfzData];
  lastUpdate = new Date();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Pobrano ${cachedData.length} rekordów w ${duration}s`);
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

export function getExport(ids: string[]): string {
  const selected = cachedData.filter(f => ids.includes(f.id));
  return selected.map(f => `
═══════════════════════════════════════
${f.title}
Data: ${f.date} | Źródło: ${f.ingestMethod.toUpperCase()}
───────────────────────────────────────
${f.summary}

${f.officialRationale ? `Uzasadnienie:\n${f.officialRationale}\n` : ''}
Link: ${f.sourceUrl}
═══════════════════════════════════════
  `).join('\n\n');
}
