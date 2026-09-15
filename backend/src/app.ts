import type Database from 'better-sqlite3';
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import { createAuthRouter } from './auth/auth.routes';
import { AuthService } from './auth/auth.service';
import { config, type readConfig } from './config';
import { CatalogRepository } from './catalog/catalog.repository';
import { createCatalogRouter } from './catalog/catalog.routes';
import { createBookingRouter } from './booking/booking.routes';
import { correlationContext } from './middleware/context';
import { errorHandler, notFoundHandler } from './middleware/error';

type AppConfig = ReturnType<typeof readConfig>;

/** Creates the Express application with an injectable SQLite database for testing. */
export function createApp(database: Database.Database, runtimeConfig: AppConfig = config): Express {
  const app = express();
  const authService = new AuthService(database, runtimeConfig.TOKEN_SECRET);
  app.disable('x-powered-by');
  app.use(cors({ origin: runtimeConfig.CORS_ORIGIN, credentials: false }));
  app.use(correlationContext);
  app.use(express.json({ limit: '64kb' }));
  app.use(((error, _request, response, next) => {
    if (error instanceof SyntaxError || (typeof error === 'object' && error !== null && 'type' in error && (error.type === 'entity.parse.failed' || error.type === 'entity.too.large'))) {
      const correlationId = String(response.getHeader('X-Correlation-Id') ?? 'unavailable');
      response.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Request JSON is invalid or too large.', correlationId } });
      return;
    }
    next(error);
  }) as ErrorRequestHandler);
  app.get('/api/health', (_request: Request, response: Response) => {
    try {
      database.prepare('SELECT 1').get();
      response.status(200).json({ data: { status: 'ok' } });
    } catch {
      const correlationId = String(response.getHeader('X-Correlation-Id') ?? 'unavailable');
      response.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Service readiness is unavailable.', correlationId } });
    }
  });
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api', createCatalogRouter(new CatalogRepository(database)));
  app.use('/api', createBookingRouter(database));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
