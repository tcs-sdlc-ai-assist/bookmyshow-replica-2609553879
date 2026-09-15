import Link from 'next/link';
import { MovieCatalog } from '../../src/catalog/MovieCatalog';

/** Renders the explicit first step of movie discovery. */
export default function DashboardPage() {
  return <main className="catalog-shell"><header className="catalog-header"><Link className="wordmark" href="/">CINEMA / BOOKING</Link><p>Step 01 / 03</p></header><p className="kicker">Movie catalogue</p><h1 className="catalog-title">Choose a film.</h1><MovieCatalog /></main>;
}