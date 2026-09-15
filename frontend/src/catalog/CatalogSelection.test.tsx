import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from '../api/client';
import { JourneyProvider, useJourney } from '../journey/JourneyProvider';
import { MovieCatalog } from './MovieCatalog';
import { TheatreList } from './TheatreList';
import { SeatSelection } from '../seats/SeatSelection';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('../api/client', () => ({ get: vi.fn() }));
const push = vi.fn(); const mockedGet = vi.mocked(get);
/** Shows the journey state for observable interaction assertions. */
function StateProbe() { const { state } = useJourney(); return <output role="status">{JSON.stringify({ movie: state.movie?.title ?? null, theatre: state.theatre?.name ?? null, seats: state.seats, totalPrice: state.totalPrice })}</output>; }
/** Renders a catalogue element in the journey provider. */
function renderJourney(component: React.ReactNode) { return render(<JourneyProvider>{component}<StateProbe /></JourneyProvider>); }

describe('catalogue selection', () => {
  afterEach(() => vi.clearAllMocks());
  it('renders returned movies without selecting one until its named action', async () => { vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>); mockedGet.mockResolvedValue({ movies: [{ id: 1, title: 'Paradise' }] }); const user = userEvent.setup(); renderJourney(<MovieCatalog />); await screen.findByRole('heading', { name: 'Paradise' }); expect(screen.getByRole('status')).toHaveTextContent('"movie":null'); await user.click(screen.getByRole('button', { name: 'Select Paradise' })); expect(screen.getByRole('status')).toHaveTextContent('"movie":"Paradise"'); expect(push).toHaveBeenCalledWith('/theatres'); });
  it('filters returned theatres by an explicitly selected movie', async () => { vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>); mockedGet.mockResolvedValueOnce({ movies: [{ id: 1, title: 'Paradise' }] }).mockResolvedValueOnce({ theatres: [{ id: 1, name: 'Sandhya 70mm' }, { id: 3, name: 'Allu Cinemas' }], mappings: [{ movieId: 1, theatreId: 1 }, { movieId: 3, theatreId: 3 }] }); const user = userEvent.setup(); renderJourney(<><MovieCatalog /><TheatreList /></>); await user.click(await screen.findByRole('button', { name: 'Select Paradise' })); expect(await screen.findByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible(); expect(screen.queryByRole('heading', { name: 'Allu Cinemas' })).not.toBeInTheDocument(); });
  it('keeps the grid inert until Select Seats applies the fixed bundle', async () => { vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>); const user = userEvent.setup(); renderJourney(<SeatSelection />); await user.click(screen.getByRole('button', { name: 'Seat A1' })); expect(screen.getByText('Selected seats: None')).toBeInTheDocument(); expect(screen.getByRole('status')).toHaveTextContent('"totalPrice":null'); await user.click(screen.getByRole('button', { name: 'Select Seats' })); expect(screen.getByText('Selected seats: A1, A2, A3')).toBeInTheDocument(); expect(screen.getByRole('status')).toHaveTextContent('"totalPrice":450'); expect(push).toHaveBeenCalledWith('/payment'); });
});