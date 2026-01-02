import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeRSS } from '../scrapers/rssScraper.js';
import { SOURCES } from '../config/sources.js';
import { LegalFact } from '../types/index.js';

const prisma = new PrismaClient();

export class RSSWorker {
  private scheduler?: cron.ScheduledTask;
  private isRunning = false;
  private lastRun?: Date;
  private documentsToday = 0;

  async start(): Promise<void> {
    console.log('📡 RSS Worker starting...');
    
    // Pierwszy run natychmiast (w tle)
    setTimeout(() => this.run(), 2000);
    
    // Harmonogram: co 15 minut (RSS rzadziej się aktualizuje)
    this.scheduler = cron.schedule('*/15 * * * *', () => {
      if (!this.isRunning) {
        this.run();
      }
    });
    
    console.log('✅ RSS Worker: scheduler aktywny (co 15 min)');
  }

  async stop(): Promise<void> {
    if (this.scheduler) {
      this.scheduler.stop();
      console.log('⏸️  RSS Worker: scheduler zatrzymany');
    }
  }

  private async run(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  RSS Worker: poprzedni run jeszcze trwa, pomijam');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📡 [${timestamp}] RSS Worker: START`);
      console.log(`${'═'.repeat(60)}\n`);

      // Pobierz dane z obu feedów RSS
      const [zusRss, cezRss] = await Promise.allSettled([
        scrapeRSS(SOURCES.RSS_ZUS, 'zus'),
        scrapeRSS(SOURCES.RSS_CEZ, 'cez')
      ]);

      const zusData = zusRss.status === 'fulfilled' ? zusRss.value : [];
      const cezData = cezRss.status === 'fulfilled' ? cezRss.value : [];
      
      if (zusRss.status === 'rejected') {
        console.error(`❌ ZUS RSS error:`, zusRss.reason?.message);
      }
      if (cezRss.status === 'rejected') {
        console.error(`❌ CEZ RSS error:`, cezRss.reason?.message);
      }

      const allRSSData = [...zusData, ...cezData];
      
      // Zapisz do bazy z deduplikacją
      let successCount = 0;
      let errorCount = 0;
      
      for (const fact of allRSSData) {
        try {
          const enrichedFact = this.enrichFact(fact);
          
          await prisma.legalFact.upsert({
            where: { compositeKey: enrichedFact.compositeKey },
            update: {
              title: enrichedFact.title,
              summary: enrichedFact.summary,
              updatedAt: new Date()
            },
            create: {
              compositeKey: enrichedFact.compositeKey,
              sourceId: enrichedFact.sourceId,
              docId: enrichedFact.docId,
              ingestMethod: enrichedFact.ingestMethod,
              eliUri: enrichedFact.eliUri,
              title: enrichedFact.title,
              summary: enrichedFact.summary,
              date: enrichedFact.date,
              impact: enrichedFact.impact,
              category: enrichedFact.category,
              legalStatus: enrichedFact.legalStatus,
              officialRationale: enrichedFact.officialRationale,
              sourceUrl: enrichedFact.sourceUrl
            }
          });
          successCount++;
        } catch (dbError: any) {
          errorCount++;
          console.error(`❌ DB error (${fact.id}):`, dbError.message);
        }
      }
      
      this.documentsToday += successCount;
      this.lastRun = new Date();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const endTimestamp = new Date().toISOString();
      
      console.log(`\n${'═'.repeat(60)}`);
      if (errorCount > 0) {
        console.log(`⚠️  [${endTimestamp}] RSS Worker: CZĘŚCIOWY SUKCES`);
        console.log(`   📊 Zapisano: ${successCount}/${allRSSData.length} (${errorCount} błędów)`);
      } else {
        console.log(`✅ [${endTimestamp}] RSS Worker: SUKCES`);
        console.log(`   📊 Zapisano: ${allRSSData.length} dokumentów`);
      }
      console.log(`   ⏱️  Czas: ${duration}s`);
      console.log(`   📈 Dzisiaj łącznie: ${this.documentsToday} dokumentów`);
      console.log(`${'═'.repeat(60)}\n`);
      
    } catch (error: any) {
      console.error(`❌ RSS Worker: KRYTYCZNY BŁĄD:`, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  private enrichFact(fact: LegalFact): LegalFact & { compositeKey: string; sourceId: string; docId: string } {
    // Format ID RSS: "rss-zus-timestamp-random" → sourceId="rss-zus", docId=timestamp-random
    const parts = fact.id.split('-');
    let sourceId = 'rss-unknown';
    let docId = fact.id;
    
    if (fact.id.startsWith('rss-')) {
      sourceId = parts.slice(0, 2).join('-'); // "rss-zus" lub "rss-cez"
      docId = parts.slice(2).join('-');
    }
    
    const compositeKey = `${sourceId}:${docId}:${fact.date}`;
    
    return {
      ...fact,
      compositeKey,
      sourceId,
      docId
    };
  }

  getStatus() {
    return {
      status: this.isRunning ? 'running' : 'idle',
      lastRun: this.lastRun?.toISOString(),
      documentsToday: this.documentsToday
    };
  }
}
