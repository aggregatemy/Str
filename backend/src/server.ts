import { app } from './app.js';
import { workerManager } from './services/workerManager.js';

const PORT = process.env.PORT || 5554;

// KROK 1: Uruchom serwer HTTP NATYCHMIAST
const server = app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ [${timestamp}] Backend HTTP działa na http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health/detailed`);
  console.log(`${'='.repeat(70)}\n`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} jest zajęty! Sprawdź inne procesy Node.js.`);
    process.exit(1);
  }
  console.error('❌ Błąd serwera:', err);
});

// KROK 2: Uruchom wszystkie workery (ELI, RSS, NFZ) W TLE
setTimeout(async () => {
  try {
    await workerManager.startAll();
  } catch (err: any) {
    console.error('❌ Błąd uruchamiania workerów:', err.message);
  }
}, 500); // 500ms delay, żeby serwer był gotowy

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️  Otrzymano SIGTERM, zatrzymywanie workerów...');
  await workerManager.stopAll();
  server.close(() => {
    console.log('✅ Serwer zamknięty');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n⏸️  Otrzymano SIGINT (Ctrl+C), zatrzymywanie workerów...');
  await workerManager.stopAll();
  server.close(() => {
    console.log('✅ Serwer zamknięty');
    process.exit(0);
  });
});
