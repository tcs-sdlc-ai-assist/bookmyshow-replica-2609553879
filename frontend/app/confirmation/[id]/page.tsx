'use client';

import { useEffect, useState } from 'react';
import { get, type BookingConfirmationResponse } from '../../../src/api/client';

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

/** Fetches and displays a persisted booking confirmation by its backend booking ID. */
export default function ConfirmationByIdPage({ params }: ConfirmationPageProps) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmationResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void params.then(({ id }) => setBookingId(id));
  }, [params]);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    async function loadConfirmation(): Promise<void> {
      setIsLoading(true);
      setError('');
      try {
        setConfirmation(await get<BookingConfirmationResponse>(`/api/bookings/${bookingId}`));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your booking confirmation.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadConfirmation();
  }, [bookingId]);

  if (isLoading) {
    return (
      <main className="workflow-shell">
        <section className="auth-card" aria-live="polite">
          <p className="processing-copy">Loading booking confirmation...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="workflow-shell">
        <section className="auth-card">
          <p className="form-error" role="alert">
            {error}
          </p>
          <button className="button button-primary" onClick={() => window.location.reload()} type="button">
            Retry confirmation
          </button>
        </section>
      </main>
    );
  }

  if (!confirmation) {
    return (
      <main className="workflow-shell">
        <section className="auth-card">
          <p className="form-error" role="alert">
            No booking confirmation is available.
          </p>
        </section>
      </main>
    );
  }

  const { confirmationId, booking } = confirmation;
  return (
    <main className="workflow-shell">
      <section className="auth-card" aria-labelledby="confirmation-title">
        <p className="kicker">Booking confirmed</p>
        <h1 id="confirmation-title">Congratulations!</h1>
        <p className="confirmation-id">{confirmationId}</p>
        <dl className="selection-summary">
          <dt>Movie</dt>
          <dd>{booking.movie}</dd>
          <dt>Theatre</dt>
          <dd>{booking.theatre}</dd>
          <dt>Seats</dt>
          <dd>{booking.seats.join(', ')}</dd>
          <dt>Payment method</dt>
          <dd>{booking.paymentMethod}</dd>
          <dt>Total</dt>
          <dd>₹{booking.totalPrice}</dd>
        </dl>
      </section>
    </main>
  );
}
