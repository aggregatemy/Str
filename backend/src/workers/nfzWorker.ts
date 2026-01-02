import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeNFZ } from '../scrapers/nfzScraper.js';
import { LegalFact } from '../types/index.js';

const prisma = new PrismaClient();

export class NFZWorker {
  private scheduler?: cron.ScheduledTask;
  private isRunning = false;
  private lastRun?: Date;
  private documentsToday = 0;

  async start(): Promise<void> {
    console.log('🏥 NFZ Worker starting...');
    
    // Pierwszy run natychmiast (w tle)
    setTimeout(() => this.run(), 3000);
    
    // Harmonogram: co 20 minut (NFZ scraper jest wolny)
    this.scheduler = cron.schedule('*/20 * * * *', () => {
      if (!this.isRunning) {
        this.run();
      }
    });
    
    console.log('✅ NFZ Worker: scheduler aktywny (co 20 min)');
  }

  async stop(): Promise<void> {
    if (this.scheduler) {
      this.scheduler.stop();
      console.log('⏸️  NFZ Worker: scheduler zatrzymany');
    }
  }

  private async run(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  NFZ Worker: poprzedni run jeszcze trwa, pomijam');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`🏥 [${timestamp}] NFZ Worker: START`);
      console.log(`${'═'.repeat(60)}\n`);

      // Pobierz dane z scrapera NFZ
      const nfzData = await scrapeNFZ();
      
      // Zapisz do bazy z deduplikacją
      let successCount = 0;
      let errorCount = 0;
      
      for (const fact of nfzData) {
        try {
          const enrichedFact = this.enrichFact(fact);
          
          await prisma.legalFact.upsert({
            where: { compositeKey: enrichedFact.compositeKey },
            update: {
              title: enrichedFact.title,
              summary: enrichedFact.summary,
              legalStatus: enrichedFact.legalStatus,
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
        console.log(`⚠️  [${endTimestamp}] NFZ Worker: CZĘŚCIOWY SUKCES`);
        console.log(`   📊 Zapisano: ${successCount}/${nfzData.length} (${errorCount} błędów)`);
      } else {
        console.log(`✅ [${endTimestamp}] NFZ Worker: SUKCES`);
        console.log(`   📊 Zapisano: ${nfzData.length} dokumentów`);
      }
      console.log(`   ⏱️  Czas: ${duration}s`);
      console.log(`   📈 Dzisiaj łącznie: ${this.documentsToday} dokumentów`);
      console.log(`${'═'.repeat(60)}\n`);
      
    } catch (error: any) {
      console.error(`❌ NFZ Worker: KRYTYCZNY BŁĄD:`, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  private enrichFact(fact: LegalFact): LegalFact & { compositeKey: string; sourceId: string; docId: string } {
    // Format ID NFZ: "nfz-2025-1-timestamp" → sourceId="nfz", docId=reszta
    const sourceId = 'nfz';
    const docId = fact.id.replace('nfz-', '');
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
