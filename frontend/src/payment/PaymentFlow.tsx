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

  return (
    <section className="auth-card" aria-labelledby="payment-title">
      <p className="kicker">Booking payment</p>
      <h1 id="payment-title">Choose payment method</h1>
      <div className="payment-options" role="radiogroup" aria-label="Payment method">
        <label className="payment-option">
          <input
            checked={method === 'CARD'}
            name="paymentMethod"
            onChange={() => setMethod('CARD')}
            type="radio"
            value="CARD"
          />
          Card
        </label>
        <label className="payment-option">
          <input
            checked={method === 'UPI'}
            name="paymentMethod"
            onChange={() => setMethod('UPI')}
            type="radio"
            value="UPI"
          />
          UPI
        </label>
      </div>
      {method === 'CARD' ? (
        <div className="payment-fields">
          <label htmlFor="card-number">
            Card Number
            <input autoComplete="cc-number" id="card-number" inputMode="numeric" />
          </label>
          <label htmlFor="expiry-date">
            Expiry Date
            <input autoComplete="cc-exp" id="expiry-date" />
          </label>
          <label htmlFor="cvv">
            CVV
            <input autoComplete="cc-csc" id="cvv" inputMode="numeric" />
          </label>
        </div>
      ) : (
        <div className="payment-fields">
          <label htmlFor="upi-id">
            UPI ID
            <input autoComplete="off" id="upi-id" />
          </label>
          <p className="hint">Example: user@upi</p>
        </div>
      )}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button-primary" disabled={isSubmitting} onClick={pay} type="button">
        Pay ₹{state.totalPrice}
      </button>
    </section>
  );
}
