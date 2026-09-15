import { BookingRepository, type PersistedBookingInput } from './booking.repository';

/** Identifies expected booking failure categories for HTTP translation. */
export class BookingError extends Error {
  constructor(public readonly code: 'INVALID_BOOKING' | 'SELECTION_NOT_FOUND' | 'BOOKING_NOT_SAVED', message: string) {
    super(message);
  }
}

/** Describes untrusted booking values after their controller boundary. */
export interface BookingInput extends PersistedBookingInput {}

/** Describes the canonical response displayed by the confirmation screen. */
export interface BookingConfirmation {
  confirmationId: string;
  booking: {
    id: number;
    movie: string;
    theatre: string;
    seats: string[];
    paymentMethod: 'CARD' | 'UPI';
    totalPrice: number;
  };
}

/** Validates booking selections and produces canonical confirmation details. */
export class BookingService {
  constructor(private readonly repository: BookingRepository) {}

  /** Creates a booking after enforcing the fixed selection and pricing contract. */
  create(input: BookingInput): BookingConfirmation {
    if (!Number.isInteger(input.userId) || input.userId <= 0 || !Number.isInteger(input.movieId) || input.movieId <= 0 || !Number.isInteger(input.theatreId) || input.theatreId <= 0 || !Array.isArray(input.seats) || input.seats.join(',') !== 'A1,A2,A3' || input.totalPrice !== 450 || (input.paymentMethod !== 'CARD' && input.paymentMethod !== 'UPI')) {
      throw new BookingError('INVALID_BOOKING', 'Booking details are invalid.');
    }
    try {
      const saved = this.repository.create(input);
      if (!saved) throw new BookingError('SELECTION_NOT_FOUND', 'The selected movie and theatre are unavailable.');
      return {
        confirmationId: `BMS-${saved.id}`,
        booking: { id: saved.id, movie: saved.movie, theatre: saved.theatre, seats: input.seats, paymentMethod: input.paymentMethod, totalPrice: input.totalPrice }
      };
    } catch (error) {
      if (error instanceof BookingError) throw error;
      throw new BookingError('BOOKING_NOT_SAVED', 'The booking could not be saved.');
    }
  }
}
