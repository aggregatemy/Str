import cron from 'node-cron';
import { refreshData } from './dataService.js';

export function startScheduler(): void {
  // Pierwsze pobranie przy starcie
  console.log('🚀 Początkowe ładowanie danych...');
  refreshData();

  // Co 1 godzinę (zamiast 6h)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Harmonogram: odświeżanie danych (co 1h)');
    await refreshData();
  });

  console.log('📅 Scheduler uruchomiony: odświeżanie co 1 godzinę');
}
