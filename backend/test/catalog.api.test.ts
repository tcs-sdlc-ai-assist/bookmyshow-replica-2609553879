import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

/** Creates a real temporary SQLite database for catalogue API tests. */
function createTemporaryDatabase(): { database: Database.Database; filename: string } { const filename = path.join(os.tmpdir(), `catalog-api-${Date.now()}-${Math.random()}.sqlite`); const database = new Database(filename); database.pragma('foreign_keys = ON'); migrate(database); seed(database); return { database, filename }; }

describe('catalogue API', () => {
  let database: Database.Database; let filename: string; let app: ReturnType<typeof createApp>;
  beforeEach(() => { ({ database, filename } = createTemporaryDatabase()); app = createApp(database, { PORT: 4000, DATABASE_PATH: filename, TOKEN_SECRET: 'test-token-secret', CORS_ORIGIN: 'http://127.0.0.1:3000' }); });
  afterEach(() => { database.close(); fs.rmSync(filename, { force: true }); });
  it('returns exact movie content from the persisted catalogue', async () => { const response = await request(app).get('/api/movies'); expect(response.status).toBe(200); expect(response.body).toEqual({ data: { movies: [{ id: 1, title: 'Paradise' }, { id: 2, title: 'Bloody Romeo' }, { id: 3, title: 'OG2' }] } }); });
  it('returns theatres and mappings from the persisted catalogue', async () => { const response = await request(app).get('/api/theatres'); expect(response.status).toBe(200); expect(response.body.data.mappings).toEqual([{ movieId: 1, theatreId: 1 }, { movieId: 1, theatreId: 2 }, { movieId: 2, theatreId: 2 }, { movieId: 3, theatreId: 3 }]); expect(response.body.data.theatres).toHaveLength(3); });
  it('returns client-safe availability errors when catalogue queries fail', async () => { database.close(); const response = await request(app).get('/api/movies'); expect(response.status).toBe(503); expect(response.body.error.code).toBe('CATALOG_UNAVAILABLE'); });
});