import { PrismaClient } from '@prisma/client';
import { LegalFact } from '../types/index.js';
import { scrapeAllELI } from '../scrapers/eliScraper.js';
import { scrapeSejmAPI } from '../scrapers/sejmApiScraper.js';
import { scrapeRSS } from '../scrapers/rssScraper.js';
import { scrapeNFZ } from '../scrapers/nfzScraper.js';
import { SOURCES } from '../config/sources.js';

const prisma = new PrismaClient();

export async function refreshData(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔄 [${timestamp}] Odświeżanie danych z wszystkich źródeł (ELI + RSS + Scrapers)...`);
  console.log(`${'─'.repeat(60)}\n`);
  const startTime = Date.now();
  
  // Pobieranie ze wszystkich źródeł (ELI sources, Sejm API, RSS, NFZ)
  const [eliSources, sejmApi, zusRss, cezRss, nfz] = await Promise.allSettled([
    scrapeAllELI(),
    scrapeSejmAPI(),
    scrapeRSS(SOURCES.RSS_ZUS, 'zus'),
    scrapeRSS(SOURCES.RSS_CEZ, 'cez'),
    scrapeNFZ()
  ]);

  // Szczegółowe logowanie błędów z Promise.allSettled
  if (eliSources.status === 'rejected') {
    console.error(`❌ [${new Date().toISOString()}] ELI scraper error:`, eliSources.reason?.message || eliSources.reason);
  }
  if (sejmApi.status === 'rejected') {
    console.error(`❌ [${new Date().toISOString()}] Sejm API scraper error:`, sejmApi.reason?.message || sejmApi.reason);
  }
  if (zusRss.status === 'rejected') {
    console.error(`❌ [${new Date().toISOString()}] ZUS RSS scraper error:`, zusRss.reason?.message || zusRss.reason);
  }
  if (cezRss.status === 'rejected') {
    console.error(`❌ [${new Date().toISOString()}] CEZ RSS scraper error:`, cezRss.reason?.message || cezRss.reason);
  }
  if (nfz.status === 'rejected') {
    console.error(`❌ [${new Date().toISOString()}] NFZ scraper error:`, nfz.reason?.message || nfz.reason);
  }

  const eliData = eliSources.status === 'fulfilled' ? eliSources.value : [];
  const sejmData = sejmApi.status === 'fulfilled' ? sejmApi.value : [];
  const zusData = zusRss.status === 'fulfilled' ? zusRss.value : [];
  const cezData = cezRss.status === 'fulfilled' ? cezRss.value : [];
  const nfzData = nfz.status === 'fulfilled' ? nfz.value : [];

  const allData = [...eliData, ...sejmData, ...zusData, ...cezData, ...nfzData];

  // Zapisz do bazy SQLite (upsert - update lub insert)
  let successCount = 0;
  let errorCount = 0;
  
  for (const fact of allData) {
    try {
      // compositeKey jest teraz PK - używaj do upsert
      const compositeKey = `${fact.eliUri}:${fact.id}:${fact.date}`;
      
      await prisma.legalFact.upsert({
        where: { compositeKey },
        update: {
          title: fact.title,
          summary: fact.summary,
          legalStatus: fact.legalStatus,
          officialRationale: fact.officialRationale,
        },
        create: {
          compositeKey,
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
      successCount++;
    } catch (dbError: any) {
      errorCount++;
      console.error(`❌ [${new Date().toISOString()}] Błąd zapisu do bazy (${fact.id}):`, dbError.message);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const endTimestamp = new Date().toISOString();
  console.log(`\n${'─'.repeat(60)}`);
  if (errorCount > 0) {
    console.log(`⚠️  [${endTimestamp}] CZĘŚCIOWY SUKCES: ${successCount}/${allData.length} rekordów zapisanych (${errorCount} błędów) w ${duration}s`);
  } else {
    console.log(`✅ [${endTimestamp}] SUKCES: Zapisano ${allData.length} rekordów do SQLite w ${duration}s`);
  }
  console.log(`   📊 ELI: ${eliData.length} | Sejm API: ${sejmData.length} | ZUS RSS: ${zusData.length} | CEZ RSS: ${cezData.length} | NFZ: ${nfzData.length}`);
  console.log(`${'─'.repeat(60)}\n`);
}

function getRangeDays(range: string | undefined): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  if (range === '90d') return 90;
  return 120;
}

export async function getData(range?: string, method?: string, source?: string): Promise<LegalFact[]> {
  const timestamp = new Date().toISOString();
  let whereClause: any = {};

  // Filtrowanie po dacie
  if (range) {
    const days = getRangeDays(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    whereClause.date = { gte: cutoffDate.toISOString().split('T')[0] };
    console.log(`🔍 [${timestamp}] Filtr daty: ostatnie ${days} dni (od ${cutoffDate.toISOString().split('T')[0]})`);
  }

  // Filtrowanie po metodzie
  if (method) {
    whereClause.ingestMethod = method;
    console.log(`🔍 [${timestamp}] Filtr metody: ${method}`);
  }

  // Filtrowanie po konkretnym źródle (opcjonalne)
  if (source) {
    whereClause.sourceId = source;
    console.log(`🔍 [${timestamp}] Filtr źródła: ${source}`);
  }

  const records = await prisma.legalFact.findMany({
    where: whereClause,
    orderBy: { date: 'desc' }
  });
  
  console.log(`📊 [${timestamp}] Znaleziono ${records.length} rekordów w bazie`);

  return records.map(r => ({
    id: r.compositeKey,
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
    where: { compositeKey: { in: ids } }
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
