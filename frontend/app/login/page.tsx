import Link from 'next/link';
import { LoginForm } from '../../src/auth/LoginForm';

/** Renders the first mobile-identifier step of authentication. */
export default function LoginPage() {
  return (
    <main className="workflow-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="wordmark" href="/">CINEMA / ACCESS</Link>
        <p className="kicker">Step 01 / 02</p>
        <h1 id="login-title">Identify your booking journey.</h1>
        <p className="lead">Enter the mobile identifier associated with your access flow.</p>
        <LoginForm />
      </section>
    </main>
  );
}
