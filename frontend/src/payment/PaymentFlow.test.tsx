import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentFlow } from './PaymentFlow';

const push = vi.fn();
const dispatch = vi.fn();
const createBooking = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../api/client', () => ({ createBooking: (...args: unknown[]) => createBooking(...args) }));

let journeyState = {
  movie: { id: 1, title: 'Arrival' },
  theatre: { id: 2, name: 'Regal' },
  seats: ['A1', 'A2', 'A3'],
  totalPrice: 450,
  paymentMethod: null
};

vi.mock('../journey/JourneyProvider', () => ({
  useJourney: () => ({ state: journeyState, dispatch })
}));

/** Verifies payment guards, method switching, and visible booking recovery. */
describe('PaymentFlow', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    journeyState = {
      movie: { id: 1, title: 'Arrival' },
      theatre: { id: 2, name: 'Regal' },
      seats: ['A1', 'A2', 'A3'],
      totalPrice: 450,
      paymentMethod: null
    };
  });

  it('does not enter processing when the booking selection is incomplete', () => {
    journeyState = { ...journeyState, seats: null, totalPrice: null };
    render(<PaymentFlow />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹' }));
    expect(screen.getByRole('button', { name: 'Pay ₹' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides card fields when UPI is selected', () => {
    render(<PaymentFlow />);
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('UPI'));
    expect(screen.queryByLabelText('Card Number')).toBeNull();
    expect(screen.getByLabelText('UPI ID')).toBeInTheDocument();
    expect(screen.getByText('Example: user@upi')).toBeInTheDocument();
  });

  it('returns a rejected booking to payment with a visible error and allows a retry', async () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    createBooking
      .mockRejectedValueOnce(new Error('Booking could not be saved.'))
      .mockResolvedValueOnce({
        confirmationId: 'BMS-8',
        booking: { id: 8, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 }
      });
    render(<PaymentFlow />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹450' }));
    now = 2000;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await vi.runAllTimersAsync();
      await Promise.resolve();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Booking could not be saved.');
    expect(screen.getByRole('button', { name: 'Pay ₹450' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹450' }));
    now = 4000;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await vi.runAllTimersAsync();
      await Promise.resolve();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay ₹450' })).toBeDisabled();
  });

  it('waits at least 2000ms and renders the confirmation outcome returned by the API', async () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    createBooking.mockResolvedValue({
      confirmationId: 'BMS-7',
      booking: { id: 7, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 }
    });
    render(<PaymentFlow />);

    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹450' }));
    expect(screen.getByRole('button', { name: 'Pay ₹450' })).toBeDisabled();
    now = 1999;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1999);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    now = 2000;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await vi.runAllTimersAsync();
      await Promise.resolve();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay ₹450' })).toBeDisabled();
  });
});
