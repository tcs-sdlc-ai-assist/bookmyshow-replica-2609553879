import Database from 'better-sqlite3';

/** Seeds the deterministic demo actor and catalogue without duplicating rows. */
export function seed(database: Database.Database): void {
  const seedData = database.transaction(() => {
    database.prepare('INSERT OR IGNORE INTO users (id, mobile) VALUES (?, ?)').run(1, 'demo-actor');
    database.prepare('DELETE FROM movie_theatres').run();
    database.prepare('DELETE FROM movies WHERE id NOT IN (?, ?, ?)').run(1, 2, 3);
    database.prepare('DELETE FROM theatres WHERE id NOT IN (?, ?, ?)').run(1, 2, 3);

    const insertMovie = database.prepare('INSERT OR IGNORE INTO movies (id, title, starts_at) VALUES (?, ?, ?)');
    const updateMovie = database.prepare('UPDATE movies SET title = ?, starts_at = ? WHERE id = ?');
    const movies = [[1, 'Paradise', '2030-01-01T19:00:00.000Z'], [2, 'Bloody Romeo', '2030-01-02T19:00:00.000Z'], [3, 'OG2', '2030-01-03T19:00:00.000Z']] as const;
    for (const [id, title, startsAt] of movies) {
      insertMovie.run(id, title, startsAt);
      updateMovie.run(title, startsAt, id);
    }

    const insertTheatre = database.prepare('INSERT OR IGNORE INTO theatres (id, name, city) VALUES (?, ?, ?)');
    const updateTheatre = database.prepare('UPDATE theatres SET name = ?, city = ? WHERE id = ?');
    const theatres = [[1, 'Sandhya 70mm', 'Hyderabad'], [2, 'Sudharsham 70mm', 'Hyderabad'], [3, 'Allu Cinemas', 'Hyderabad']] as const;
    for (const [id, name, city] of theatres) {
      insertTheatre.run(id, name, city);
      updateTheatre.run(name, city, id);
    }

    const insertMapping = database.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)');
    insertMapping.run(1, 1);
    insertMapping.run(1, 2);
    insertMapping.run(2, 2);
    insertMapping.run(3, 3);
  });
  seedData();
}
