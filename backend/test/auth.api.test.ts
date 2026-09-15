import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

/** Creates a migrated and seeded file-backed test database. */
function createTemporaryDatabase(): { database: Database.Database; filename: string } {
  const filename = path.join(os.tmpdir(), `auth-api-${Date.now()}-${Math.random()}.sqlite`);
  const database = new Database(filename);
  database.pragma('foreign_keys = ON');
  migrate(database);
  seed(database);
  return { database, filename };
}

describe('authentication API', () => {
  let database: Database.Database;
  let filename: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    ({ database, filename } = createTemporaryDatabase());
    app = createApp(database, {
      PORT: 4000,
      DATABASE_PATH: filename,
      TOKEN_SECRET: 'test-token-secret',
      CORS_ORIGIN: 'http://127.0.0.1:3000'
    });
  });

  afterEach(() => {
    database.close();
    fs.rmSync(filename, { force: true });
  });

  it('returns health data and a correlation id', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
    expect(response.headers['x-correlation-id']).toBeTruthy();
  });

  it('accepts a string mobile without writing a user', async () => {
    const before = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    const response = await request(app).post('/api/auth/login').send({ mobile: 'demo-actor' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { accepted: true, mobile: 'demo-actor' } });
    const after = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    expect(after.count).toBe(before.count);
  });

  it.each([undefined, {}, { mobile: 9 }, ['demo-actor']])('rejects malformed login requests', async (body) => {
    const response = await request(app).post('/api/auth/login').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
    expect(response.body.error.correlationId).toBeTruthy();
  });

  it('verifies the accepted OTP and returns a non-empty signed token', async () => {
    const response = await request(app).post('/api/auth/verify').send({ mobile: 'demo-actor', otp: '1234' });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ verified: true, flowMobile: 'demo-actor', actor: { id: 1 } });
    expect(response.body.data.token.length).toBeGreaterThan(0);
  });

  it.each([{}, { mobile: 'demo-actor' }, { mobile: 1, otp: '1234' }])('rejects malformed verification requests', async (body) => {
    const response = await request(app).post('/api/auth/verify').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects an incorrect OTP with the contract error code and makes no user write', async () => {
    const before = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    const response = await request(app).post('/api/auth/verify').send({ mobile: 'new-mobile', otp: '9999' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('OTP_NOT_ACCEPTED');
    const after = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    expect(after.count).toBe(before.count);
  });
});
