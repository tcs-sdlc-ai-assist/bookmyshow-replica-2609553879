'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useJourney } from '../journey/JourneyProvider';

const seats = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
const selectedSeats = ['A1', 'A2', 'A3'];

/** Displays an inert seat grid until the fixed confirmation action is selected. */
export function SeatSelection() {
  const router = useRouter();
  const { dispatch, state } = useJourney();

  /** Applies the fixed seat bundle and advances to payment. */
  function applySeats(): void {
    dispatch({ type: 'setSeats', seats: selectedSeats, totalPrice: 450 });
    router.push('/payment');
  }

  return <section aria-label="Seat selection"><div className="seat-grid" aria-label="Inert seat grid">{seats.map((seat) => <button aria-label={`Seat ${seat}`} className="seat" key={seat} type="button">{seat}</button>)}</div><div className="selection-summary" aria-live="polite"><p>Selected seats: {state.seats?.join(', ') ?? 'None'}</p><p>Total: {state.totalPrice === null ? 'Not applied' : state.totalPrice}</p></div><button className="button button-primary" onClick={applySeats} type="button">Select Seats</button></section>;
}