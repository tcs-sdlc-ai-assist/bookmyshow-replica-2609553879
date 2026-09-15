'use client';

import { useJourney } from '../../src/journey/JourneyProvider';

/** Displays only the API-issued booking confirmation retained in journey state. */
export default function ConfirmationPage() {
  const { state } = useJourney();
  if (!state.confirmation) return <main className="workflow-shell"><section className="auth-card"><p className="form-error" role="alert">No booking confirmation is available.</p></section></main>;
  const { confirmationId, booking } = state.confirmation;
  return <main className="workflow-shell"><section className="auth-card" aria-labelledby="confirmation-title">
    <p className="kicker">Booking confirmed</p><h1 id="confirmation-title">Congratulations!</h1><p className="confirmation-id">{confirmationId}</p>
    <dl className="selection-summary"><dt>Movie</dt><dd>{booking.movie}</dd><dt>Theatre</dt><dd>{booking.theatre}</dd><dt>Seats</dt><dd>{booking.seats.join(', ')}</dd><dt>Payment method</dt><dd>{booking.paymentMethod}</dd><dt>Total</dt><dd>₹{booking.totalPrice}</dd></dl>
  </section></main>;
}
