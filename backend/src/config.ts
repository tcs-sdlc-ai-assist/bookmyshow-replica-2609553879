import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_PATH: z.string().min(1).default('./data/cinema.sqlite'),
  TOKEN_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().url().default('http://127.0.0.1:3000')
});

/** Reads and validates application configuration at startup. */
export function readConfig(environment: NodeJS.ProcessEnv = {
  PORT: process.env.PORT,
  DATABASE_PATH: process.env.DATABASE_PATH,
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN
}) {
  return environmentSchema.parse(environment);
}

/** Provides validated process configuration for runtime entry points. */
export const config = readConfig();
