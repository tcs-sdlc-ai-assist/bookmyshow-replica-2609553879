'use client';

import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { createBooking } from '../api/client';
import { useJourney, type PaymentMethod } from '../journey/JourneyProvider';

/** Collects a payment-method choice without sending payment credentials. */
export function PaymentFlow() {
  const { state, dispatch } = useJourney();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>(state.paymentMethod ?? 'CARD');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitted = useRef(false);

  /** Starts the mandatory processing interval before creating the booking. */
  const pay = (): void => {
    if (submitted.current || !state.movie || !state.theatre || !state.seats || state.totalPrice === null) return;
    submitted.current = true;
    setIsSubmitting(true);
    setError(null);
    dispatch({ type: 'setPaymentMethod', paymentMethod: method });
    router.push('/processing');
    const bookingRequest = { userId: 1, movieId: state.movie.id, theatreId: state.theatre.id, seats: state.seats, paymentMethod: method, totalPrice: state.totalPrice };
    const startedAt = performance.now();
    const submitAfterDelay = (): void => {
      const remaining = 2000 - (performance.now() - startedAt);
      if (remaining > 0) {
        window.setTimeout(submitAfterDelay, remaining);
        return;
      }
      void createBooking(bookingRequest)
        .then((confirmation) => {
          dispatch({ type: 'setConfirmation', confirmation });
          router.push('/confirmation');
        })
        .catch((reason: unknown) => {
          submitted.current = false;
          setIsSubmitting(false);
          setError(reason instanceof Error ? reason.message : 'Unable to confirm your booking.');
          router.push('/payment');
        });
    };
    window.setTimeout(submitAfterDelay, 2000);
  };

  return <section className="auth-card" aria-labelledby="payment-title">
    <p className="kicker">Booking payment</p>
    <h1 id="payment-title">Choose payment method</h1>
    <div className="payment-options" role="radiogroup" aria-label="Payment method">
      <label className="payment-option"><input type="radio" name="paymentMethod" value="CARD" checked={method === 'CARD'} onChange={() => setMethod('CARD')} /> Card</label>
      <label className="payment-option"><input type="radio" name="paymentMethod" value="UPI" checked={method === 'UPI'} onChange={() => setMethod('UPI')} /> UPI</label>
    </div>
    {method === 'CARD' ? <div className="payment-fields">
      <label htmlFor="card-number">Card Number<input id="card-number" inputMode="numeric" autoComplete="cc-number" /></label>
      <label htmlFor="expiry-date">Expiry Date<input id="expiry-date" autoComplete="cc-exp" /></label>
      <label htmlFor="cvv">CVV<input id="cvv" inputMode="numeric" autoComplete="cc-csc" /></label>
    </div> : <div className="payment-fields">
      <label htmlFor="upi-id">UPI ID<input id="upi-id" autoComplete="off" /></label>
      <p className="hint">Example: user@upi</p>
    </div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" type="button" onClick={pay} disabled={isSubmitting}>Pay ₹{state.totalPrice}</button>
  </section>;
}
