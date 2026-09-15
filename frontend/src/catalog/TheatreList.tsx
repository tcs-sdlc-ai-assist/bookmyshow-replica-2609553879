'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { get } from '../api/client';
import { useJourney, type Theatre } from '../journey/JourneyProvider';

interface TheatreResponse {
  theatres: Theatre[];
  mappings: Array<{ movieId: number; theatreId: number }>;
}

/** Fetches mapped theatres and requires an explicit theatre selection. */
export function TheatreList() {
  const router = useRouter();
  const { dispatch, state } = useJourney();
  const [result, setResult] = useState<TheatreResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /** Loads theatres and mappings from the catalogue endpoint. */
  async function loadTheatres(): Promise<void> {
    setIsLoading(true);
    setError('');
    try {
      setResult(await get<TheatreResponse>('/api/theatres'));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load theatres.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTheatres();
  }, []);

  const movie = state.movie;
  if (!movie) {
    return (
      <section className="status-panel">
        <p className="form-error">Select a movie before choosing a theatre.</p>
        <button className="button button-primary" onClick={() => router.push('/dashboard')} type="button">
          Choose a movie
        </button>
      </section>
    );
  }

  if (isLoading) {
    return <p className="status-panel" aria-live="polite">Loading theatres…</p>;
  }

  if (error) {
    return (
      <section className="status-panel" aria-live="assertive">
        <p className="form-error">{error}</p>
        <button className="button button-primary" onClick={() => void loadTheatres()} type="button">
          Retry theatres
        </button>
      </section>
    );
  }

  const mappedIds = new Set(
    result?.mappings
      .filter((mapping) => mapping.movieId === movie.id)
      .map((mapping) => mapping.theatreId)
  );
  const theatres = result?.theatres.filter((theatre) => mappedIds.has(theatre.id)) ?? [];

  return (
    <section className="catalog-grid" aria-label={`Theatres for ${movie.title}`}>
      {theatres.map((theatre) => (
        <article className="catalog-item" key={theatre.id}>
          <p>Mapped venue</p>
          <h2>{theatre.name}</h2>
          <button
            className="button button-primary"
            onClick={() => {
              dispatch({ type: 'setTheatre', theatre });
              router.push('/seats');
            }}
            type="button"
          >
            Select {theatre.name}
          </button>
        </article>
      ))}
    </section>
  );
}
