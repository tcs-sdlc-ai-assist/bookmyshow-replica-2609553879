import jwt from 'jsonwebtoken';
import type Database from 'better-sqlite3';

/** Describes a successful OTP verification result. */
export interface VerificationResult {
  verified: true;
  token: string;
  flowMobile: string;
  actor: { id: number };
}

/** Handles stateless login acceptance and demo OTP verification. */
export class AuthService {
  /** Creates an authentication service backed by the supplied SQLite connection. */
  public constructor(
    private readonly database: Database.Database,
    private readonly tokenSecret: string
  ) {}

  /** Accepts a mobile identifier without writing user records. */
  public acceptLogin(mobile: string): { accepted: true; mobile: string } {
    return { accepted: true, mobile };
  }

  /** Verifies the demo OTP and issues a signed token for the seeded actor. */
  public verifyOtp(mobile: string, otp: string): VerificationResult | null {
    if (otp !== '1234') {
      return null;
    }
    const actor = this.database.prepare('SELECT id FROM users WHERE id = ?').get(1) as { id: number } | undefined;
    if (!actor) {
      throw new Error('Demo actor is unavailable.');
    }
    const token = jwt.sign({ sub: String(actor.id), mobile, role: 'demo-actor' }, this.tokenSecret, { expiresIn: '1h' });
    return { verified: true, token, flowMobile: mobile, actor: { id: actor.id } };
  }
}
