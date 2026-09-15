import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';

/** Chains authentication, catalogue selection, and booking persistence over the real app. */
describe('booking journey integration', () => {
  let database: Database.Database; let databasePath: string;
  beforeEach(() => { databasePath = path.join(os.tmpdir(), `journey-${Date.now()}-${Math.random()}.db`); database = new Database(databasePath); database.pragma('foreign_keys = ON'); migrate(database); database.prepare('INSERT INTO users (id, mobile) VALUES (1, ?)').run('9876543210'); database.prepare('INSERT INTO movies (id, title, starts_at) VALUES (1, ?, ?)').run('Arrival', '2026-01-01T10:00:00Z'); database.prepare('INSERT INTO theatres (id, name, city) VALUES (1, ?, ?)').run('Regal', 'Mumbai'); database.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (1, 1)').run(); });
  afterEach(() => { database.close(); fs.unlinkSync(databasePath); });
  it('chains login through booking then re-queries persistence', async () => {
    const app = createApp(database); const mobile = '9876543210';
    const login = await request(app).post('/api/auth/login').send({ mobile });
    expect(login.status).toBe(200);
    await request(app).post('/api/auth/verify').send({ mobile, otp: '1111' });
    const actor = database.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile) as { id: number };
    expect((await request(app).get('/api/movies')).status).toBe(200);
    await request(app).get('/api/movies/1/theatres');
    const booked = await request(app).post('/api/bookings').send({ userId: actor.id, movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 }); expect(booked.status).toBe(201);
    expect(database.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 1 });
  });
  it('does not create a booking for an invalid mapping', async () => {
    const response = await request(createApp(database)).post('/api/bookings').send({ userId: 1, movieId: 1, theatreId: 999, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 });
    expect(response.status).toBe(404); expect(database.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 0 });
  });
});
