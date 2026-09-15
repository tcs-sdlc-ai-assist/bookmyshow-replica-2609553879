import { Router } from 'express';
import { BookingController } from './booking.controller';
import { BookingRepository } from './booking.repository';
import { BookingService } from './booking.service';
import type Database from 'better-sqlite3';

/** Creates the router for booking confirmation requests. */
export function createBookingRouter(database: Database.Database): Router {
  const controller = new BookingController(new BookingService(new BookingRepository(database)));
  const router = Router();
  router.post('/bookings', controller.create);
  return router;
}
