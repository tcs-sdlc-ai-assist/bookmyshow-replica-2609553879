import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BookingRepository } from '../src/booking/booking.repository';
import { BookingError, BookingService } from '../src/booking/booking.service';
import { migrate } from '../src/db/migrate';

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
    database.prepare('INSERT INTO users (id, mobile) VALUES (1, ?)').run('9999999999');
    database.prepare('INSERT INTO movies (id, title, starts_at) VALUES (1, ?, ?)').run('Arrival', '2026-01-01T10:00:00Z');
    database.prepare('INSERT INTO theatres (id, name, city) VALUES (1, ?, ?)').run('Regal', 'Mumbai');
    database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (1, 1)').run();
    service = new BookingService(new BookingRepository(database));
  });

  afterEach(() => { database.close(); fs.unlinkSync(databasePath); });

  it('persists a valid booking and returns canonical catalogue labels', () => {
    const confirmation = service.create(input);
    expect(confirmation).toEqual({ confirmationId: 'BMS-1', booking: { id: 1, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 } });
    expect(database.prepare('SELECT seats, payment_method, total_price FROM bookings WHERE id = 1').get()).toEqual({ seats: '["A1","A2","A3"]', payment_method: 'CARD', total_price: 450 });
  });

  it.each([{ ...input, seats: ['A1', 'A3', 'A2'] }, { ...input, totalPrice: 451 }, { ...input, paymentMethod: 'CASH' as 'CARD' }])('rejects invalid booking values', (invalid) => {
    expect(() => service.create(invalid)).toThrow(new BookingError('INVALID_BOOKING', 'Booking details are invalid.'));
  });

  it('rejects an unmapped movie and theatre selection without inserting a booking', () => {
    database.prepare('INSERT INTO theatres (id, name, city) VALUES (2, ?, ?)').run('Odeon', 'Delhi');
    expect(() => service.create({ ...input, theatreId: 2 })).toThrow(new BookingError('SELECTION_NOT_FOUND', 'The selected movie and theatre are unavailable.'));
    expect(database.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 0 });
  });
});
