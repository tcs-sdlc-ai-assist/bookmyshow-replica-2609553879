import { Router } from 'express';
import { createCatalogController } from './catalog.controller';
import type { CatalogRepository } from './catalog.repository';

/** Creates the public routes used to discover movies and mapped theatres. */
export function createCatalogRouter(repository: CatalogRepository): Router {
  const router = Router();
  const controller = createCatalogController(repository);
  router.get('/movies', controller.listMovies);
  router.get('/theatres', controller.listTheatres);
  return router;
}