import Link from 'next/link';
import { SeatSelection } from '../../src/seats/SeatSelection';

/** Renders the fixed-seat selection step. */
export default function SeatsPage() {
  return <main className="catalog-shell"><header className="catalog-header"><Link className="wordmark" href="/">CINEMA / BOOKING</Link><p>Step 03 / 03</p></header><p className="kicker">Seat selection</p><h1 className="catalog-title">Confirm your seats.</h1><SeatSelection /></main>;
}