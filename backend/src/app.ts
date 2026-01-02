
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes/api.js';
import { workerManager } from './services/workerManager.js';
import { swaggerSpec } from './config/swagger.js';

export const app = express();

// Middleware logowania wszystkich requestów
app.use((req, res, next) => {
  // Only log if not in test environment to avoid clutter
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);
  }
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
  const PORT = process.env.PORT || 5554;
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
