import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeAllELI } from '../scrapers/eliScraper.js';
import { scrapeSejmAPI } from '../scrapers/sejmApiScraper.js';
import { LegalFact } from '../types/index.js';

const prisma = new PrismaClient();

export class ELIWorker {
  private scheduler?: cron.ScheduledTask;
  private isRunning = false;
  private lastRun?: Date;
  private documentsToday = 0;

  async start(): Promise<void> {
    console.log('🇪🇺 ELI Worker starting...');
    
    // Pierwszy run natychmiast (w tle, nie blokuje)
    setTimeout(() => this.run(), 1000);
    
    // Harmonogram: co 10 minut
    this.scheduler = cron.schedule('*/10 * * * *', () => {
      if (!this.isRunning) {
        this.run();
      }
    });
    
    console.log('✅ ELI Worker: scheduler aktywny (co 10 min)');
  }

  async stop(): Promise<void> {
    if (this.scheduler) {
      this.scheduler.stop();
      console.log('⏸️  ELI Worker: scheduler zatrzymany');
    }
  }

  private async run(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  ELI Worker: poprzedni run jeszcze trwa, pomijam');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`🇪🇺 [${timestamp}] ELI Worker: START`);
      console.log(`${'═'.repeat(60)}\n`);

      // Pobierz dane ze wszystkich źródeł ELI (Sejm API + ministerstwa)
      const [eliSources, sejmApi] = await Promise.allSettled([
        scrapeAllELI(),    // 7 źródeł XML (ministerstwa + NBP)
        scrapeSejmAPI()    // 2 źródła JSON (Sejm DU + MP)
      ]);

      const eliData = eliSources.status === 'fulfilled' ? eliSources.value : [];
      const sejmData = sejmApi.status === 'fulfilled' ? sejmApi.value : [];
      
      if (eliSources.status === 'rejected') {
        console.error(`❌ ELI sources error:`, eliSources.reason?.message);
      }
      if (sejmApi.status === 'rejected') {
        console.error(`❌ Sejm API error:`, sejmApi.reason?.message);
      }

      const allELIData = [...eliData, ...sejmData];
      
      // Zapisz do bazy z deduplikacją
      let successCount = 0;
      let errorCount = 0;
      
      for (const fact of allELIData) {
        try {
          // Generuj compositeKey i wypełnij sourceId, docId
          const enrichedFact = this.enrichFact(fact);
          
          await prisma.legalFact.upsert({
            where: { compositeKey: enrichedFact.compositeKey },
            update: {
              title: enrichedFact.title,
              summary: enrichedFact.summary,
              legalStatus: enrichedFact.legalStatus,
              officialRationale: enrichedFact.officialRationale,
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
        console.log(`⚠️  [${endTimestamp}] ELI Worker: CZĘŚCIOWY SUKCES`);
        console.log(`   📊 Zapisano: ${successCount}/${allELIData.length} (${errorCount} błędów)`);
      } else {
        console.log(`✅ [${endTimestamp}] ELI Worker: SUKCES`);
        console.log(`   📊 Zapisano: ${allELIData.length} dokumentów`);
      }
      console.log(`   ⏱️  Czas: ${duration}s`);
      console.log(`   📈 Dzisiaj łącznie: ${this.documentsToday} dokumentów`);
      console.log(`${'═'.repeat(60)}\n`);
      
    } catch (error: any) {
      console.error(`❌ ELI Worker: KRYTYCZNY BŁĄD:`, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  private enrichFact(fact: LegalFact): LegalFact & { compositeKey: string; sourceId: string; docId: string } {
    // Wyciągnij sourceId z ID (format: "eli-sejm-du-2025-1" → "eli-sejm-du")
    const parts = fact.id.split('-');
    let sourceId = 'eli-unknown';
    let docId = fact.id;
    
    if (fact.id.startsWith('eli-sejm-')) {
      sourceId = parts.slice(0, 3).join('-'); // "eli-sejm-du" lub "eli-sejm-mp"
      docId = parts.slice(3).join('-');
    } else if (fact.id.startsWith('eli-')) {
      sourceId = parts.slice(0, 2).join('-'); // "eli-mz", "eli-nbp", etc.
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
