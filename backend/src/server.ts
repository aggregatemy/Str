import dotenv from 'dotenv';
import { app } from './app';
import { startHourlySyncJob } from './jobs/hourly-sync';
import { startDailyEmailJob } from './jobs/daily-email';
import { logger } from './utils/logger';
import { getDatabase, closeDatabase } from './db/client';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database
try {
  getDatabase();
  logger.info('Database initialized successfully');
} catch (error) {
  logger.error('Failed to initialize database', { error });
  process.exit(1);
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on http://${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/health`);
  logger.info(`API endpoint: http://${HOST}:${PORT}/api/v1/updates`);
  
  // Start cron jobs
  startHourlySyncJob();
  startDailyEmailJob();
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    closeDatabase();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', { reason });
  gracefulShutdown('unhandledRejection');
});

export default server;
