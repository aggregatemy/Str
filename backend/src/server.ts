import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes/api.js';
import { workerManager } from './services/workerManager.js';
import { swaggerSpec } from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 5554;

// Middleware logowania wszystkich requestów
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Swagger UI - dokumentacja OpenAPI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Strażnik Prawa API Docs'
}));

// Health check (zawsze działa, nawet bez danych)
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Detailed health check z statusami workerów
app.get('/api/v1/health/detailed', (req, res) => {
  const status = workerManager.getDetailedStatus();
  res.json(status);
});

app.use('/api/v1', apiRoutes);

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
