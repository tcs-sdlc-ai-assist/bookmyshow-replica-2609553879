import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';

/** Counts persisted bookings to prove rejected requests have no write side effect. */
function bookingCount(database: Database.Database): number {
  return (database.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count;
}

/** Exercises the booking HTTP contract against real file-backed SQLite. */
describe('POST /api/bookings', () => {
  let database: Database.Database;
  let databasePath: string;
  const body = { userId: 1, movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPrice: 450 };

  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `booking-api-${Date.now()}-${Math.random()}.db`);
    database = new Database(databasePath);
    database.pragma('foreign_keys = ON');
    migrate(database);
    database.prepare('INSERT INTO users (id, mobile_number) VALUES (1, ?)').run('9999999999');
    database.prepare('INSERT INTO movies (id, title) VALUES (1, ?)').run('Arrival');
    database.prepare('INSERT INTO theatres (id, name) VALUES (1, ?)').run('Regal');
    database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (1, 1)').run();
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
  });

  it('returns the canonical 201 confirmation payload', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send(body);
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ confirmationId: 'BMS-1', booking: { id: 1, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPrice: 450 } });
  });

  it('retrieves the canonical confirmation from the booking persisted by POST', async () => {
    const created = await request(createApp(database)).post('/api/bookings').send(body);
    const response = await request(createApp(database)).get(`/api/bookings/${created.body.data.booking.id}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(created.body.data);
  });

  it.each(['0', '-1', 'abc', '1.5', '9007199254740992'])('rejects invalid booking identifiers with a client-safe envelope', async (id) => {
    const response = await request(createApp(database)).get(`/api/bookings/${id}`);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_BOOKING', message: 'Booking details are invalid.' });
    expect(response.body.error.correlationId).toBeTruthy();
  });

  it('returns SELECTION_NOT_FOUND for a missing persisted booking', async () => {
    const response = await request(createApp(database)).get('/api/bookings/99');
    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'SELECTION_NOT_FOUND', message: 'The selected booking is unavailable.' });
    expect(response.body.error.correlationId).toBeTruthy();
  });

  it.each([
    ['malformed seats JSON', '["A1",'],
    ['a non-string JSON array member', '["A1",7,"A3"]']
  ])('returns BOOKING_NOT_SAVED without a confirmation for %s', async (_description, seats) => {
    const inserted = database.prepare(`
      INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price)
      VALUES (1, 1, 1, ?, 'UPI', 450)
    `).run(seats);

    const response = await request(createApp(database)).get(`/api/bookings/${inserted.lastInsertRowid}`);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: expect.objectContaining({ code: 'BOOKING_NOT_SAVED', message: 'The booking could not be retrieved.' })
    });
    expect(response.body.error.correlationId).toBeTruthy();
    expect(response.body.data).toBeUndefined();
  });

  it.each([
    {},
    { ...body, userId: undefined }, { ...body, userId: 0 }, { ...body, userId: '1' },
    { ...body, movieId: undefined }, { ...body, movieId: 0 }, { ...body, movieId: '1' },
    { ...body, theatreId: undefined }, { ...body, theatreId: 0 }, { ...body, theatreId: '1' },
    { ...body, seats: undefined }, { ...body, seats: [] }, { ...body, seats: ['A1', 'A2', ''] }, { ...body, seats: 'A1,A2,A3' },
    { ...body, paymentMethod: undefined }, { ...body, paymentMethod: '' }, { ...body, paymentMethod: 7 },
    { ...body, totalPrice: undefined }, { ...body, totalPrice: '450' }
  ])('rejects missing or mistyped booking fields without persistence', async (invalidBody) => {
    const before = bookingCount(database);
    const response = await request(createApp(database)).post('/api/bookings').send(invalidBody);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_BOOKING');
    expect(bookingCount(database)).toBe(before);
  });

  it.each([
    { ...body, userId: '1 OR 1=1' },
    { ...body, movieId: '1; DROP TABLE bookings;--' },
    { ...body, theatreId: '1 UNION SELECT 1' },
    { ...body, seats: ['A1', 'A2', "A3'); DROP TABLE bookings;--"] },
    { ...body, paymentMethod: "UPI'); DROP TABLE bookings;--" },
    { ...body, totalPrice: '450 OR 1=1' }
  ])('rejects injection-looking booking input and leaves bookings unchanged', async (attackBody) => {
    const before = bookingCount(database);
    const response = await request(createApp(database)).post('/api/bookings').send(attackBody);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_BOOKING');
    expect(bookingCount(database)).toBe(before);
    expect(database.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?').get('table', 'bookings')).toBeTruthy();
  });

  it('returns SELECTION_NOT_FOUND for an unknown mapping without inserting a booking', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send({ ...body, theatreId: 99 });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SELECTION_NOT_FOUND');
    expect(bookingCount(database)).toBe(0);
  });

  it.each(['{', JSON.stringify({ ...body, ignored: 'x'.repeat(70 * 1024) })])('rejects malformed or over-limit JSON with a client-safe envelope and no write', async (payload) => {
    const before = bookingCount(database);
    const response = await request(createApp(database)).post('/api/bookings').set('Content-Type', 'application/json').send(payload);
    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_REQUEST', message: 'Request JSON is invalid or too large.' });
    expect(response.body.error.correlationId).toBeTruthy();
    expect(bookingCount(database)).toBe(before);
  });
});
