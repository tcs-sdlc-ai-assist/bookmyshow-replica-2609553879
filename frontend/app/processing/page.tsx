import Link from 'next/link';

/** Displays the required intermediate processing status. */
export default function ProcessingPage() {
  return <main className="workflow-shell"><section className="auth-card" aria-live="polite"><p className="kicker">Booking payment</p><h1>Processing</h1><p className="processing-copy">Processing Payment...</p><Link className="wordmark" href="/payment">Return to payment</Link></section></main>;
}
