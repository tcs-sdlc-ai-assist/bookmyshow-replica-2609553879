import type Database from 'better-sqlite3';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { createAuthRouter } from './auth/auth.routes';
import { AuthService } from './auth/auth.service';
import { config, type readConfig } from './config';
import { CatalogRepository } from './catalog/catalog.repository';
import { createCatalogRouter } from './catalog/catalog.routes';
import { correlationContext } from './middleware/context';
import { errorHandler, notFoundHandler } from './middleware/error';

type AppConfig = ReturnType<typeof readConfig>;

/** Creates the Express application with an injectable SQLite database for testing. */
export function createApp(database: Database.Database, runtimeConfig: AppConfig = config): Express {
  const app = express();
  const authService = new AuthService(database, runtimeConfig.TOKEN_SECRET);
  app.disable('x-powered-by');
  app.use(cors({ origin: runtimeConfig.CORS_ORIGIN, credentials: false }));
  app.use(express.json({ limit: '64kb' }));
  app.use(correlationContext);
  app.get('/api/health', (_request: Request, response: Response) => {
    response.status(200).json({ data: { status: 'ok' } });
  });
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api', createCatalogRouter(new CatalogRepository(database)));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
