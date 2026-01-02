import cron from 'node-cron';
import { refreshData } from './dataService.js';

export function startScheduler(): void {
  // Pierwsze pobranie przy starcie
  refreshData();

  // Co 6 godzin
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Scheduled refresh triggered');
    await refreshData();
  });

  console.log('📅 Scheduler uruchomiony (co 6h)');
}
