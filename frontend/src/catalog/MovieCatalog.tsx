'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { get } from '../api/client';
import { useJourney, type Movie } from '../journey/JourneyProvider';

/** Fetches movies and requires an explicit selection before continuing. */
export function MovieCatalog() {
  const router = useRouter();
  const { dispatch } = useJourney();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /** Loads movies from the catalogue endpoint. */
  async function loadMovies(): Promise<void> {
    setIsLoading(true);
    setError('');
    try {
      const result = await get<{ movies: Movie[] }>('/api/movies');
      setMovies(result.movies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load movies.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMovies();
  }, []);

  /** Stores a complete movie selection after the named user action. */
  function selectMovie(movie: Movie): void {
    dispatch({ type: 'setMovie', movie });
    router.push('/theatres');
  }

  if (isLoading) {
    return <p className="status-panel" aria-live="polite">Loading movies…</p>;
  }

  if (error) {
    return (
      <section className="status-panel" aria-live="assertive">
        <p className="form-error">{error}</p>
        <button className="button button-primary" onClick={() => void loadMovies()} type="button">
          Retry movies
        </button>
      </section>
    );
  }

  if (movies.length === 0) {
    return <p className="status-panel" role="status">No movies are currently available.</p>;
  }

  return (
    <section className="catalog-grid" aria-label="Movie catalogue">
      {movies.map((movie) => (
        <article className="catalog-item" key={movie.id}>
          <div className="visual-placeholder" aria-hidden="true">{movie.title.slice(0, 1)}</div>
          <h2>{movie.title}</h2>
          <p>Available now / selection required</p>
          <button className="button button-primary" onClick={() => selectMovie(movie)} type="button">
            Select {movie.title}
          </button>
        </article>
      ))}
    </section>
  );
}
