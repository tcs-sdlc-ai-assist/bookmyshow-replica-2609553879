import type Database from 'better-sqlite3';

/** Represents a discoverable movie. */
export interface Movie {
  id: number;
  title: string;
}

/** Represents a discoverable theatre. */
export interface Theatre {
  id: number;
  name: string;
}

/** Represents an allowed movie-to-theatre relationship. */
export interface TheatreMapping {
  movieId: number;
  theatreId: number;
}

/** Reads catalogue data through parameterized SQLite statements. */
export class CatalogRepository {
  /** Creates a repository backed by the shared SQLite connection. */
  public constructor(private readonly database: Database.Database) {}

  /** Lists movies in their stable catalogue order. */
  public listMovies(): Movie[] {
    return this.database.prepare('SELECT id, title FROM movies ORDER BY id').all() as Movie[];
  }

  /** Lists theatres and their movie relationships in stable order. */
  public listTheatres(): { theatres: Theatre[]; mappings: TheatreMapping[] } {
    const theatres = this.database.prepare('SELECT id, name FROM theatres ORDER BY id').all() as Theatre[];
    const mappings = this.database
      .prepare('SELECT movie_id AS movieId, theatre_id AS theatreId FROM movie_theatres ORDER BY movie_id, theatre_id')
      .all() as TheatreMapping[];
    return { theatres, mappings };
  }
}