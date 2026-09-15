import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../middleware/error';
import type { CatalogRepository } from './catalog.repository';

/** Creates HTTP handlers for catalogue discovery. */
export function createCatalogController(repository: CatalogRepository): {
  listMovies: (request: Request, response: Response, next: NextFunction) => void;
  listTheatres: (request: Request, response: Response, next: NextFunction) => void;
} {
  /** Responds with the persisted movie catalogue. */
  function listMovies(_request: Request, response: Response, next: NextFunction): void {
    try {
      response.status(200).json({ data: { movies: repository.listMovies() } });
    } catch (error) {
      next(new ApiError(503, 'CATALOG_UNAVAILABLE', 'Movie catalogue is temporarily unavailable.'));
    }
  }

  /** Responds with persisted theatres and their permitted mappings. */
  function listTheatres(_request: Request, response: Response, next: NextFunction): void {
    try {
      response.status(200).json({ data: repository.listTheatres() });
    } catch (error) {
      next(new ApiError(503, 'THEATRES_UNAVAILABLE', 'Theatre catalogue is temporarily unavailable.'));
    }
  }

  return { listMovies, listTheatres };
}