import Database from 'better-sqlite3';

/** Seeds the deterministic demo actor and catalogue without duplicating rows. */
export function seed(database: Database.Database): void {
  const seedData = database.transaction(() => {
    database.prepare('INSERT OR IGNORE INTO users (id, mobile_number) VALUES (?, ?)').run(1, 'demo-actor');
    database.prepare('DELETE FROM movie_theatres').run();
    database.prepare('DELETE FROM movies WHERE id NOT IN (?, ?, ?)').run(1, 2, 3);
    database.prepare('DELETE FROM theatres WHERE id NOT IN (?, ?, ?)').run(1, 2, 3);

    const insertMovie = database.prepare('INSERT OR IGNORE INTO movies (id, title) VALUES (?, ?)');
    const updateMovie = database.prepare('UPDATE movies SET title = ? WHERE id = ?');
    const movies = [[1, 'Paradise'], [2, 'Bloody Romeo'], [3, 'OG2']] as const;
    for (const [id, title] of movies) {
      insertMovie.run(id, title);
      updateMovie.run(title, id);
    }

    const insertTheatre = database.prepare('INSERT OR IGNORE INTO theatres (id, name) VALUES (?, ?)');
    const updateTheatre = database.prepare('UPDATE theatres SET name = ? WHERE id = ?');
    const theatres = [[1, 'Sandhya 70mm'], [2, 'Sudharsham 70mm'], [3, 'Allu Cinemas']] as const;
    for (const [id, name] of theatres) {
      insertTheatre.run(id, name);
      updateTheatre.run(name, id);
    }

    const insertMapping = database.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)');
    insertMapping.run(1, 1);
    insertMapping.run(1, 2);
    insertMapping.run(2, 2);
    insertMapping.run(3, 3);
  });
  seedData();
}
