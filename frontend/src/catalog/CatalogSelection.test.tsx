import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from '../api/client';
import { JourneyProvider } from '../journey/JourneyProvider';
import { MovieCatalog } from './MovieCatalog';
import { TheatreList } from './TheatreList';
import { SeatSelection } from '../seats/SeatSelection';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('../api/client', () => ({ get: vi.fn() }));

const push = vi.fn();
const mockedGet = vi.mocked(get);

/** Renders a catalogue element inside the required journey state. */
function renderJourney(component: React.ReactNode) {
  return render(<JourneyProvider>{component}</JourneyProvider>);
}

describe('catalogue selection', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders a loading state before showing an explicit empty API result', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    let resolveMovies: (value: { movies: [] }) => void = () => undefined;
    mockedGet.mockReturnValueOnce(new Promise((resolve) => {
      resolveMovies = resolve;
    }));

    renderJourney(<MovieCatalog />);
    expect(screen.getByText('Loading movies…')).toBeVisible();

    resolveMovies({ movies: [] });
    expect(await screen.findByText('No movies are currently available.')).toBeVisible();
  });

  it('renders the fetch error and lets the user retry into returned movies', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    mockedGet
      .mockRejectedValueOnce(new Error('Catalogue temporarily unavailable.'))
      .mockResolvedValueOnce({ movies: [{ id: 1, title: 'Paradise' }] });
    const user = userEvent.setup();

    renderJourney(<MovieCatalog />);
    expect(await screen.findByText('Catalogue temporarily unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry movies' }));
    expect(await screen.findByRole('heading', { name: 'Paradise' })).toBeVisible();
  });

  it('shows the selected movie’s mapped theatre after the named selection action', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    mockedGet
      .mockResolvedValueOnce({ movies: [{ id: 1, title: 'Paradise' }] })
      .mockResolvedValueOnce({
        theatres: [{ id: 1, name: 'Sandhya 70mm' }],
        mappings: [{ movieId: 1, theatreId: 1 }]
      });
    const user = userEvent.setup();

    renderJourney(
      <>
        <MovieCatalog />
        <TheatreList />
      </>
    );
    expect(await screen.findByRole('heading', { name: 'Paradise' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Select Paradise' }));
    expect(await screen.findByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible();
  });

  it('asks the user to choose a movie when TheatreList has no selection', () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);

    renderJourney(<TheatreList />);

    expect(screen.getByText('Select a movie before choosing a theatre.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choose a movie' })).toBeVisible();
  });

  it('shows a theatre fetch failure and retries into mapped results', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    let resolveTheatres: (value: {
      theatres: Array<{ id: number; name: string }>;
      mappings: Array<{ movieId: number; theatreId: number }>;
    }) => void = () => undefined;
    mockedGet
      .mockResolvedValueOnce({ movies: [{ id: 1, title: 'Paradise' }] })
      .mockRejectedValueOnce(new Error('Theatre catalogue temporarily unavailable.'))
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveTheatres = resolve;
      }));
    const user = userEvent.setup();

    renderJourney(
      <>
        <MovieCatalog />
        <TheatreList />
      </>
    );
    await user.click(await screen.findByRole('button', { name: 'Select Paradise' }));
    expect(await screen.findByText('Theatre catalogue temporarily unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry theatres' }));
    expect(screen.getByText('Loading theatres…')).toBeVisible();

    resolveTheatres({
      theatres: [{ id: 1, name: 'Sandhya 70mm' }],
      mappings: [{ movieId: 1, theatreId: 1 }]
    });

    expect(await screen.findByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible();
  });

  it('filters returned theatres by an explicitly selected movie', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    mockedGet
      .mockResolvedValueOnce({ movies: [{ id: 1, title: 'Paradise' }] })
      .mockResolvedValueOnce({
        theatres: [{ id: 1, name: 'Sandhya 70mm' }, { id: 3, name: 'Allu Cinemas' }],
        mappings: [{ movieId: 1, theatreId: 1 }, { movieId: 3, theatreId: 3 }]
      });
    const user = userEvent.setup();

    renderJourney(
      <>
        <MovieCatalog />
        <TheatreList />
      </>
    );
    await user.click(await screen.findByRole('button', { name: 'Select Paradise' }));
    expect(await screen.findByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Allu Cinemas' })).not.toBeInTheDocument();
  });

  it('keeps the grid inert until Select Seats applies the fixed bundle', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    const user = userEvent.setup();

    renderJourney(<SeatSelection />);
    await user.click(screen.getByRole('button', { name: 'Seat A1' }));
    expect(screen.getByText('Selected seats: None')).toBeInTheDocument();
    expect(screen.getByText('Total: Not applied')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select Seats' }));
    expect(screen.getByText('Selected seats: A1, A2, A3')).toBeInTheDocument();
    expect(screen.getByText('Total: 450')).toBeInTheDocument();
  });
});
