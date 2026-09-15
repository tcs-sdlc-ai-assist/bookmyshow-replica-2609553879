import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentFlow } from './PaymentFlow';

const push = vi.fn();
const dispatch = vi.fn();
const createBooking = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../api/client', () => ({ createBooking: (...args: unknown[]) => createBooking(...args) }));
vi.mock('../journey/JourneyProvider', () => ({
  useJourney: () => ({ state: { movie: { id: 1, title: 'Arrival' }, theatre: { id: 2, name: 'Regal' }, seats: ['A1', 'A2', 'A3'], totalPrice: 450, paymentMethod: null }, dispatch })
}));

/** Verifies payment method switching and the mandatory delayed booking request. */
describe('PaymentFlow', () => {
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  it('hides card fields when UPI is selected', () => {
    render(<PaymentFlow />);
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('UPI'));
    expect(screen.queryByLabelText('Card Number')).toBeNull();
    expect(screen.getByLabelText('UPI ID')).toBeInTheDocument();
    expect(screen.getByText('Example: user@upi')).toBeInTheDocument();
  });

  it('waits at least 2000ms, sends one preserved request, and uses returned confirmation', async () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    createBooking.mockResolvedValue({ confirmationId: 'BMS-7', booking: { id: 7, movie: 'Arrival', theatre: 'Regal', seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 } });
    render(<PaymentFlow />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹450' }));
    expect(screen.getByRole('button', { name: 'Pay ₹450' })).toBeDisabled();
    now = 1999;
    await act(async () => { await vi.advanceTimersByTimeAsync(1999); });
    expect(createBooking).not.toHaveBeenCalled();
    now = 2000;
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(createBooking).toHaveBeenCalledTimes(1);
    expect(createBooking).toHaveBeenCalledWith({ userId: 1, movieId: 1, theatreId: 2, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setConfirmation', confirmation: expect.objectContaining({ confirmationId: 'BMS-7' }) });
    expect(push).toHaveBeenCalledWith('/confirmation');
  });
});
