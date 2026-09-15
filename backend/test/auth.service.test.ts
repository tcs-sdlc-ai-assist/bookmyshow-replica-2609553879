import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../src/auth/auth.service';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

/** Creates a real temporary SQLite database for authentication tests. */
function createTemporaryDatabase(): { database: Database.Database; filename: string } {
  const filename = path.join(os.tmpdir(), `auth-service-${Date.now()}-${Math.random()}.sqlite`);
  const database = new Database(filename);
  database.pragma('foreign_keys = ON');
  migrate(database);
  seed(database);
  return { database, filename };
}

describe('AuthService', () => {
  let database: Database.Database;
  let filename: string;
  let service: AuthService;

  beforeEach(() => {
    ({ database, filename } = createTemporaryDatabase());
    service = new AuthService(database, 'test-token-secret');
  });

  afterEach(() => {
    database.close();
    fs.rmSync(filename, { force: true });
  });

  it('returns a signed verification result for the accepted demo OTP', () => {
    const result = service.verifyOtp('demo-actor', '1234');
    expect(result).not.toBeNull();
    expect(result?.verified).toBe(true);
    expect(result?.token.length).toBeGreaterThan(0);
    expect(result?.flowMobile).toBe('demo-actor');
    expect(result?.actor).toEqual({ id: 1 });
  });

  it('returns null for an unaccepted OTP without writing a user', () => {
    const before = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    expect(service.verifyOtp('new-mobile', '0000')).toBeNull();
    const after = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
    expect(after.count).toBe(before.count);
  });
});
