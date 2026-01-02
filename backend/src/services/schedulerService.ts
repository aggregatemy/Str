import cron from 'node-cron';
import { refreshData } from './dataService.js';

export function startScheduler(): void {
  // Pierwsze pobranie przy starcie
  refreshData();

  // Co 1 minutę (dla środowiska europejskiego)
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Scheduled refresh triggered');
    await refreshData();
  });

  console.log('📅 Scheduler uruchomiony (co 1 min)');
}
