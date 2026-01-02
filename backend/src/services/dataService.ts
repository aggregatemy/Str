import { PrismaClient } from '@prisma/client';
import { LegalFact } from '../types/index.js';
import { scrapeAllELI } from '../scrapers/eliScraper.js';
import { scrapeSejmAPI } from '../scrapers/sejmApiScraper.js';
import { scrapeRSS } from '../scrapers/rssScraper.js';
import { scrapeNFZ } from '../scrapers/nfzScraper.js';
import { SOURCES } from '../config/sources.js';

const prisma = new PrismaClient();

export async function refreshData(): Promise<void> {
  console.log('🔄 Odświeżanie danych z wszystkich źródeł (ELI + RSS + Scrapers)...');
  const startTime = Date.now();
  
  // Pobieranie ze wszystkich źródeł (ELI sources, Sejm API, RSS, NFZ)
  const [eliSources, sejmApi, zusRss, cezRss, nfz] = await Promise.allSettled([
    scrapeAllELI(),
    scrapeSejmAPI(),
    scrapeRSS(SOURCES.RSS_ZUS, 'zus'),
    scrapeRSS(SOURCES.RSS_CEZ, 'cez'),
    scrapeNFZ()
  ]);

  const eliData = eliSources.status === 'fulfilled' ? eliSources.value : [];
  const sejmData = sejmApi.status === 'fulfilled' ? sejmApi.value : [];
  const zusData = zusRss.status === 'fulfilled' ? zusRss.value : [];
  const cezData = cezRss.status === 'fulfilled' ? cezRss.value : [];
  const nfzData = nfz.status === 'fulfilled' ? nfz.value : [];

  const allData = [...eliData, ...sejmData, ...zusData, ...cezData, ...nfzData];

  // Zapisz do bazy SQLite (upsert - update lub insert)
  for (const fact of allData) {
    await prisma.legalFact.upsert({
      where: { id: fact.id },
      update: {
        title: fact.title,
        summary: fact.summary,
        legalStatus: fact.legalStatus,
        officialRationale: fact.officialRationale,
      },
      create: {
        id: fact.id,
        ingestMethod: fact.ingestMethod,
        eliUri: fact.eliUri,
        title: fact.title,
        summary: fact.summary,
        date: fact.date,
        impact: fact.impact,
        category: fact.category,
        legalStatus: fact.legalStatus,
        officialRationale: fact.officialRationale,
        sourceUrl: fact.sourceUrl,
      }
    });
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Zapisano ${allData.length} rekordów do SQLite w ${duration}s`);
}

export async function getData(range?: string, method?: string): Promise<LegalFact[]> {
  let whereClause: any = {};

  // Filtrowanie po dacie
  if (range) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    whereClause.date = { gte: cutoffDate.toISOString().split('T')[0] };
  }

  // Filtrowanie po metodzie
  if (method) {
    whereClause.ingestMethod = method;
  }

  const records = await prisma.legalFact.findMany({
    where: whereClause,
    orderBy: { date: 'desc' }
  });

  return records.map(r => ({
    id: r.id,
    ingestMethod: r.ingestMethod as 'eli' | 'rss' | 'scraper',
    eliUri: r.eliUri,
    title: r.title,
    summary: r.summary,
    date: r.date,
    impact: r.impact as 'low' | 'medium' | 'high',
    category: r.category,
    legalStatus: r.legalStatus,
    officialRationale: r.officialRationale,
    sourceUrl: r.sourceUrl,
  }));
}

export async function getExport(ids: string[]): Promise<string> {
  const selected = await prisma.legalFact.findMany({
    where: { id: { in: ids } }
  });

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
