import type { ErrorRequestHandler, RequestHandler } from 'express';

/** Represents a client-safe application error. */
export class ApiError extends Error {
  /** Creates a client-safe error with a stable status and code. */
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

/** Converts unknown routes into the standard API error envelope. */
export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found.',
      correlationId: response.locals.correlationId
    }
  });
};

/** Serializes errors without logging or exposing authentication-sensitive values. */
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const isKnownError = error instanceof ApiError;
  const status = isKnownError ? error.status : 500;
  const code = isKnownError ? error.code : 'INTERNAL_ERROR';
  const message = isKnownError ? error.message : 'An unexpected error occurred.';
  response.status(status).json({
    error: { code, message, correlationId: response.locals.correlationId }
  });
};
