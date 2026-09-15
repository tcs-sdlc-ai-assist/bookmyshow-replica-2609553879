import Link from 'next/link';

/** Renders the public entry point for the access workflow. */
export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-panel" aria-labelledby="home-title">
        <p className="kicker">Cinema access</p>
        <h1 id="home-title">Your seat starts with a simple check-in.</h1>
        <p className="lead">Use your mobile identifier, confirm the demo code, and continue to the next booking step.</p>
        <Link className="button button-primary" href="/login">
          Start access
        </Link>
      </section>
    </main>
  );
}
