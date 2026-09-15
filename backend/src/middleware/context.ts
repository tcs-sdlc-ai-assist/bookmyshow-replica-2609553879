import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/** Adds a correlation identifier to each request and response. */
export const correlationContext: RequestHandler = (request, response, next) => {
  const headerValue = request.header('x-correlation-id');
  const correlationId = headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();
  response.locals.correlationId = correlationId;
  response.setHeader('X-Correlation-Id', correlationId);
  next();
};
