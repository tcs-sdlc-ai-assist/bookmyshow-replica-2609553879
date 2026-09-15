import Link from 'next/link';
import { OtpForm } from '../../src/auth/OtpForm';

/** Renders the one-time passcode verification step. */
export default function OtpPage() {
  return (
    <main className="workflow-shell">
      <section className="auth-card" aria-labelledby="otp-title">
        <Link className="wordmark" href="/">CINEMA / ACCESS</Link>
        <p className="kicker">Step 02 / 02</p>
        <h1 id="otp-title">Confirm your access.</h1>
        <p className="lead">Enter the four-digit demo code to continue.</p>
        <OtpForm />
      </section>
    </main>
  );
}
