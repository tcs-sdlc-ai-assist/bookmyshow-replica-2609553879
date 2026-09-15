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
      mobile TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      starts_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS theatres (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movie_theatres (
      movie_id INTEGER NOT NULL,
      theatre_id INTEGER NOT NULL,
      PRIMARY KEY (movie_id, theatre_id),
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (theatre_id) REFERENCES theatres(id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      theatre_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (theatre_id) REFERENCES theatres(id)
    );
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
