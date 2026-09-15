'use client';

import { PaymentFlow } from '../../src/payment/PaymentFlow';
import { useJourney } from '../../src/journey/JourneyProvider';

/** Renders payment controls only when the booking selection is complete. */
export default function PaymentPage() {
  const { state } = useJourney();
  if (!state.movie || !state.theatre || !state.seats || state.totalPrice === null) {
    return (
      <main className="workflow-shell">
        <section className="auth-card">
          <p className="form-error" role="alert">
            Complete your movie, theatre, and seat selection before payment.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="workflow-shell">
      <PaymentFlow />
    </main>
  );
}
