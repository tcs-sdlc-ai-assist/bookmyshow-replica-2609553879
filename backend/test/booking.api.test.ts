import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';

/** Exercises the booking HTTP contract against real file-backed SQLite. */
describe('POST /api/bookings', () => {
  let database: Database.Database;
  let databasePath: string;
  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `booking-api-${Date.now()}-${Math.random()}.db`);
    database = new Database(databasePath); database.pragma('foreign_keys = ON'); migrate(database);
    database.prepare('INSERT INTO users (id, mobile) VALUES (1, ?)').run('9999999999');
    database.prepare('INSERT INTO movies (id, title, starts_at) VALUES (1, ?, ?)').run('Arrival', '2026-01-01T10:00:00Z');
    database.prepare('INSERT INTO theatres (id, name, city) VALUES (1, ?, ?)').run('Regal', 'Mumbai');
    database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (1, 1)').run();
  });
  afterEach(() => { database.close(); fs.unlinkSync(databasePath); });
  const body = { userId: 1, movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPrice: 450 };

  it('returns the canonical 201 confirmation payload', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send(body);
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ confirmationId: 'BMS-1', booking: { id: 1, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPrice: 450 } });
  });
  it('returns INVALID_BOOKING for malformed values', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send({ ...body, totalPrice: 1 });
    expect(response.status).toBe(400); expect(response.body.error.code).toBe('INVALID_BOOKING');
  });
  it('returns SELECTION_NOT_FOUND for an unknown mapping', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send({ ...body, theatreId: 99 });
    expect(response.status).toBe(404); expect(response.body.error.code).toBe('SELECTION_NOT_FOUND');
  });
});
