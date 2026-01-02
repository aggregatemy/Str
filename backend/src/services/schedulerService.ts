import cron from 'node-cron';
import { refreshData } from './dataService.js';

export function startScheduler(): void {
  // Pierwsze pobranie przy starcie
  refreshData();

  // Co 10 minut (optymalna częstotliwość - mniej obciążenie, wystarczająca aktualność)
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Scheduled refresh triggered');
    await refreshData();
  });

  console.log('📅 Scheduler uruchomiony (co 10 min)');
}
