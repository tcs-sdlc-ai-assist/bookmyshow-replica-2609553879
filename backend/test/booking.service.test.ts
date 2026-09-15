import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BookingRepository } from '../src/booking/booking.repository';
import { BookingError, BookingService } from '../src/booking/booking.service';
import { migrate } from '../src/db/migrate';

/** Counts persisted bookings to verify native constraints and transactions leave no row behind. */
function bookingCount(database: Database.Database): number {
  return (database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count;
}

/** Exercises booking validation and persistence with a fresh file-backed SQLite database. */
describe('BookingService', () => {
  let database: Database.Database;
  let databasePath: string;
  let service: BookingService;
  const input = { userId: 1, movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD' as const, totalPrice: 450 };

  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `booking-${Date.now()}-${Math.random()}.db`);
    database = new Database(databasePath);
    database.pragma('foreign_keys = ON');
    migrate(database);
    database.prepare('INSERT INTO users (id, mobile_number) VALUES (1, ?)').run('9999999999');
    database.prepare('INSERT INTO movies (id, title) VALUES (1, ?)').run('Arrival');
    database.prepare('INSERT INTO theatres (id, name) VALUES (1, ?)').run('Regal');
    database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (1, 1)').run();
    service = new BookingService(new BookingRepository(database));
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
  });

  it('persists a valid booking and returns canonical catalogue labels', () => {
    const confirmation = service.create(input);
    expect(confirmation).toEqual({ confirmationId: 'BMS-1', booking: { id: 1, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 } });
    expect(database.prepare('SELECT seats, payment_method, total_price FROM bookings WHERE id = 1').get()).toEqual({ seats: '["A1","A2","A3"]', payment_method: 'CARD', total_price: 450 });
  });

  it.each([{ ...input, seats: ['A1', 'A3', 'A2'] }, { ...input, totalPrice: 451 }, { ...input, paymentMethod: 'CASH' as 'CARD' }])('rejects invalid booking values', (invalid) => {
    expect(() => service.create(invalid)).toThrow(new BookingError('INVALID_BOOKING', 'Booking details are invalid.'));
    expect(bookingCount(database)).toBe(0);
  });

  it('enforces SQLite foreign keys, NOT NULL fields, and CHECK constraints on direct writes', () => {
    const insert = database.prepare('INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?)');
    expect(() => insert.run(99, 1, 1, '["A1","A2","A3"]', 'CARD', 450)).toThrow(/FOREIGN KEY/);
    expect(() => database.prepare('INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price) VALUES (?, ?, ?, NULL, ?, ?)').run(1, 1, 1, 'CARD', 450)).toThrow(/NOT NULL/);
    expect(() => insert.run(1, 1, 1, '["A1","A2","A3"]', 'CASH', 450)).toThrow(/CHECK/);
    expect(() => insert.run(1, 1, 1, '["A1","A2","A3"]', 'CARD', 451)).toThrow(/CHECK/);
    expect(bookingCount(database)).toBe(0);
  });

  it('enforces schema uniqueness and the movie-theatre lookup index on direct SQLite writes', () => {
    expect(() => database.prepare('INSERT INTO users (id, mobile_number) VALUES (?, ?)').run(2, '9999999999')).toThrow(/UNIQUE/);
    expect(() => database.prepare('INSERT INTO movies (id, title) VALUES (?, ?)').run(2, 'Arrival')).toThrow(/UNIQUE/);
    expect(() => database.prepare('INSERT INTO theatres (id, name) VALUES (?, ?)').run(2, 'Regal')).toThrow(/UNIQUE/);
    expect(() => database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)').run(99, 1)).toThrow(/FOREIGN KEY/);
    const indexes = database.prepare("SELECT name FROM pragma_index_list('movie_theatres')").all() as { name: string }[];
    expect(indexes.map(({ name }) => name)).toContain('idx_movie_theatres_theatre');
  });

  it('rolls back a mapped booking when its user foreign key is invalid', () => {
    expect(() => service.create({ ...input, userId: 99 })).toThrow(new BookingError('BOOKING_NOT_SAVED', 'The booking could not be saved.'));
    expect(bookingCount(database)).toBe(0);
  });

  it('rejects an unmapped movie and theatre selection without inserting a booking', () => {
    database.prepare('INSERT INTO theatres (id, name) VALUES (2, ?)').run('Odeon');
    expect(() => service.create({ ...input, theatreId: 2 })).toThrow(new BookingError('SELECTION_NOT_FOUND', 'The selected movie and theatre are unavailable.'));
    expect(bookingCount(database)).toBe(0);
  });
});
