import Link from 'next/link';
import { TheatreList } from '../../src/catalog/TheatreList';

/** Renders mapped theatre discovery for the selected movie. */
export default function TheatresPage() {
  return <main className="catalog-shell"><header className="catalog-header"><Link className="wordmark" href="/">CINEMA / BOOKING</Link><p>Step 02 / 03</p></header><p className="kicker">Theatre catalogue</p><h1 className="catalog-title">Choose a theatre.</h1><TheatreList /></main>;
}