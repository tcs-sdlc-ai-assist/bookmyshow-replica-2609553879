import type Database from 'better-sqlite3';

/** Holds the database fields needed to save a validated booking. */
export interface PersistedBookingInput {
  userId: number;
  movieId: number;
  theatreId: number;
  seats: string[];
  paymentMethod: 'CARD' | 'UPI';
  totalPrice: number;
}

/** Holds the persisted catalogue labels and ID for a new booking. */
export interface SavedBooking {
  id: number;
  movie: string;
  theatre: string;
}

/** Persists bookings with a catalogue-mapping check in one SQLite transaction. */
export class BookingRepository {
  constructor(private readonly database: Database.Database) {}

  /** Saves a booking only when the supplied movie and theatre are mapped. */
  create(input: PersistedBookingInput): SavedBooking | null {
    const transaction = this.database.transaction((): SavedBooking | null => {
      const selection = this.database.prepare(`
        SELECT movies.title AS movie, theatres.name AS theatre
        FROM movie_theatres
        INNER JOIN movies ON movies.id = movie_theatres.movie_id
        INNER JOIN theatres ON theatres.id = movie_theatres.theatre_id
        WHERE movie_theatres.movie_id = ? AND movie_theatres.theatre_id = ?
      `).get(input.movieId, input.theatreId) as { movie: string; theatre: string } | undefined;
      if (!selection) return null;
      const result = this.database.prepare(`
        INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(input.userId, input.movieId, input.theatreId, JSON.stringify(input.seats), input.paymentMethod, input.totalPrice);
      return { id: Number(result.lastInsertRowid), movie: selection.movie, theatre: selection.theatre };
    });
    return transaction();
  }
}
