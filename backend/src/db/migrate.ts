import Database from 'better-sqlite3';
import { config } from '../config';
import { createDatabase } from './database';

/** Applies the authentication and future catalog schema exactly once. */
export function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      mobile_number TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS theatres (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS movie_theatres (
      movie_id INTEGER NOT NULL REFERENCES movies(id),
      theatre_id INTEGER NOT NULL REFERENCES theatres(id),
      PRIMARY KEY (movie_id, theatre_id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      movie_id INTEGER NOT NULL REFERENCES movies(id),
      theatre_id INTEGER NOT NULL REFERENCES theatres(id),
      seats TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('CARD', 'UPI')),
      total_price INTEGER NOT NULL CHECK (total_price = 450),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_movie_theatres_theatre ON movie_theatres(theatre_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON bookings(user_id, created_at DESC);
    INSERT OR IGNORE INTO schema_migrations (version) VALUES ('001_initial');
  `);
}

/** Runs migrations when invoked as a command-line utility. */
function runMigrationCommand(): void {
  const database = createDatabase(config.DATABASE_PATH);
  migrate(database);
  database.close();
}

if (require.main === module) {
  runMigrationCommand();
}
