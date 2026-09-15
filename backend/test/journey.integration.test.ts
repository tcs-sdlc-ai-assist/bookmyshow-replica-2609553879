import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

/** Chains authentication, catalogue selection, and booking persistence over the real app. */
describe('booking journey integration', () => {
  let database: Database.Database;
  let databasePath: string;

  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `journey-${Date.now()}-${Math.random()}.db`);
    database = new Database(databasePath);
    database.pragma('foreign_keys = ON');
    migrate(database);
    seed(database);
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
  });

  it('chains login, OTP 1234, catalogue discovery, mapped booking, and persisted re-query', async () => {
    const app = createApp(database);
    const mobile = '9876543210';
    const login = await request(app).post('/api/auth/login').send({ mobile });
    expect(login.status).toBe(200);

    const verification = await request(app).post('/api/auth/verify').send({ mobile, otp: '1234' });
    expect(verification.status).toBe(200);
    expect(verification.body.data).toMatchObject({ verified: true, flowMobile: mobile, actor: { id: 1 } });

    const movies = await request(app).get('/api/movies');
    const theatres = await request(app).get('/api/theatres');
    expect(movies.status).toBe(200);
    expect(theatres.status).toBe(200);
    const movie = movies.body.data.movies[0] as { id: number; title: string };
    const mapping = theatres.body.data.mappings.find((candidate: { movieId: number; theatreId: number }) => candidate.movieId === movie.id) as { movieId: number; theatreId: number };
    const theatre = theatres.body.data.theatres.find((candidate: { id: number; name: string }) => candidate.id === mapping.theatreId) as { id: number; name: string };

    const booked = await request(app).post('/api/bookings').send({ userId: verification.body.data.actor.id, movieId: movie.id, theatreId: theatre.id, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 });
    expect(booked.status).toBe(201);
    expect(booked.body.data.booking).toMatchObject({ movie: movie.title, theatre: theatre.name });
    expect(database.prepare('SELECT user_id, movie_id, theatre_id, seats FROM bookings WHERE id = ?').get(booked.body.data.booking.id)).toEqual({ user_id: 1, movie_id: movie.id, theatre_id: theatre.id, seats: '["A1","A2","A3"]' });
  });

  it('rejects a discovered but unmapped movie/theatre pairing without an extra persisted booking', async () => {
    const app = createApp(database);
    const movies = await request(app).get('/api/movies');
    const theatres = await request(app).get('/api/theatres');
    const movie = movies.body.data.movies[0] as { id: number };
    const unmappedTheatre = theatres.body.data.theatres.find((theatre: { id: number }) => !theatres.body.data.mappings.some((mapping: { movieId: number; theatreId: number }) => mapping.movieId === movie.id && mapping.theatreId === theatre.id)) as { id: number };
    expect(unmappedTheatre).toBeTruthy();

    const response = await request(app).post('/api/bookings').send({ userId: 1, movieId: movie.id, theatreId: unmappedTheatre.id, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SELECTION_NOT_FOUND');
    expect(database.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 0 });
  });
});
