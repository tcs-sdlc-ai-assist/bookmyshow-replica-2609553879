import Database from 'better-sqlite3';

/** Seeds the deterministic demo actor and a minimal future movie catalogue. */
export function seed(database: Database.Database): void {
  const seedData = database.transaction(() => {
    database.prepare('INSERT OR IGNORE INTO users (id, mobile) VALUES (?, ?)').run(1, 'demo-actor');
    database.prepare('INSERT OR IGNORE INTO movies (id, title, starts_at) VALUES (?, ?, ?)').run(1, 'Future Feature', '2030-01-01T19:00:00.000Z');
    database.prepare('INSERT OR IGNORE INTO theatres (id, name, city) VALUES (?, ?, ?)').run(1, 'Demo Theatre', 'Demo City');
    database.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)').run(1, 1);
  });
  seedData();
}
