import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/** Opens one SQLite database connection and enables foreign key enforcement. */
export function createDatabase(databasePath: string): Database.Database {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  return database;
}
