import { ELIWorker } from '../workers/eliWorker.js';
import { RSSWorker } from '../workers/rssWorker.js';
import { NFZWorker } from '../workers/nfzWorker.js';

export class WorkerManager {
  private eliWorker: ELIWorker;
  private rssWorker: RSSWorker;
  private nfzWorker: NFZWorker;

  constructor() {
    this.eliWorker = new ELIWorker();
    this.rssWorker = new RSSWorker();
    this.nfzWorker = new NFZWorker();
  }

  async startAll(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🚀 [${timestamp}] Worker Manager: Uruchamianie wszystkich workerów`);
    console.log(`${'═'.repeat(70)}\n`);

    // Uruchom wszystkie workery równolegle (nie blokują się nawzajem)
    await Promise.all([
      this.eliWorker.start(),
      this.rssWorker.start(),
      this.nfzWorker.start()
    ]);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ [${new Date().toISOString()}] Worker Manager: Wszystkie workery uruchomione`);
    console.log(`   🇪🇺 ELI Worker:  aktywny (co 10 min)`);
    console.log(`   📡 RSS Worker:  aktywny (co 15 min)`);
    console.log(`   🏥 NFZ Worker:  aktywny (co 20 min)`);
    console.log(`${'═'.repeat(70)}\n`);
  }

  async stopAll(): Promise<void> {
    console.log('\n⏸️  Worker Manager: Zatrzymywanie wszystkich workerów...');
    await Promise.all([
      this.eliWorker.stop(),
      this.rssWorker.stop(),
      this.nfzWorker.stop()
    ]);
    console.log('✅ Worker Manager: Wszystkie workery zatrzymane\n');
  }

  getDetailedStatus() {
    return {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      workers: {
        eli: this.eliWorker.getStatus(),
        rss: this.rssWorker.getStatus(),
        nfz: this.nfzWorker.getStatus()
      }
    };
  }
}

// Singleton instance
export const workerManager = new WorkerManager();
