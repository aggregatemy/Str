import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = process.env.DATABASE_PATH || './data/straznik.db';
  const dbDir = path.dirname(dbPath);

  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }

  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  logger.info(`Database initialized at: ${dbPath}`);
  
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

export function runMigrations(): void {
  const db = getDatabase();
  const migrationPath = path.join(__dirname, 'migrations', '001_initial.sql');
  
  if (fs.existsSync(migrationPath)) {
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(migration);
    logger.info('Database migrations completed successfully');
  } else {
    logger.warn(`Migration file not found: ${migrationPath}`);
  }
}
