import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogRepository } from '../src/catalog/catalog.repository';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

/** Creates a real temporary SQLite catalogue database. */
function createTemporaryDatabase(): { database: Database.Database; filename: string } { const filename = path.join(os.tmpdir(), `catalog-repository-${Date.now()}-${Math.random()}.sqlite`); const database = new Database(filename); database.pragma('foreign_keys = ON'); migrate(database); seed(database); return { database, filename }; }

describe('CatalogRepository', () => {
  let database: Database.Database; let filename: string; let repository: CatalogRepository;
  beforeEach(() => { ({ database, filename } = createTemporaryDatabase()); repository = new CatalogRepository(database); });
  afterEach(() => { database.close(); fs.rmSync(filename, { force: true }); });
  it('returns the exact seeded movies in stable order', () => { expect(repository.listMovies()).toEqual([{ id: 1, title: 'Paradise' }, { id: 2, title: 'Bloody Romeo' }, { id: 3, title: 'OG2' }]); });
  it('returns exact theatres and permitted mappings after repeated idempotent seeding', () => { seed(database); expect(repository.listTheatres()).toEqual({ theatres: [{ id: 1, name: 'Sandhya 70mm' }, { id: 2, name: 'Sudharsham 70mm' }, { id: 3, name: 'Allu Cinemas' }], mappings: [{ movieId: 1, theatreId: 1 }, { movieId: 1, theatreId: 2 }, { movieId: 2, theatreId: 2 }, { movieId: 3, theatreId: 3 }] }); });
});