import type { NextFunction, Request, Response } from 'express';
import { BookingError, BookingService, type BookingInput } from './booking.service';

/** Converts booking HTTP input into a typed service call and response. */
export class BookingController {
  constructor(private readonly service: BookingService) {}

  /** Creates a booking and maps its known failures to the API contract. */
  create = (request: Request, response: Response, next: NextFunction): void => {
    try {
      const body: unknown = request.body;
      if (!body || typeof body !== 'object') throw new BookingError('INVALID_BOOKING', 'Booking details are invalid.');
      const value = body as Record<string, unknown>;
      const input: BookingInput = {
        userId: value.userId as number,
        movieId: value.movieId as number,
        theatreId: value.theatreId as number,
        seats: value.seats as string[],
        paymentMethod: value.paymentMethod as 'CARD' | 'UPI',
        totalPrice: value.totalPrice as number
      };
      response.status(201).json({ data: this.service.create(input) });
    } catch (error) {
      if (error instanceof BookingError) {
        const status = error.code === 'INVALID_BOOKING' ? 400 : error.code === 'SELECTION_NOT_FOUND' ? 404 : 503;
        response.status(status).json({ error: { code: error.code, message: error.message } });
        return;
      }
      next(error);
    }
  };
}
