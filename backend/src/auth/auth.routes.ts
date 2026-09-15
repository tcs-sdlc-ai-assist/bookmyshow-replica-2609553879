import { Router } from 'express';
import { createAuthController } from './auth.controller';
import { AuthService } from './auth.service';

/** Builds the versioned authentication router. */
export function createAuthRouter(authService: AuthService): Router {
  const router = Router();
  const controller = createAuthController(authService);
  router.post('/login', controller.login);
  router.post('/verify', controller.verify);
  return router;
}
