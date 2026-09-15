'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../api/client';
import { useJourney } from '../journey/JourneyProvider';

/** Collects a mobile identifier and advances only after API confirmation. */
export function LoginForm() {
  const router = useRouter();
  const { dispatch } = useJourney();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Validates and submits the mobile identifier on an explicit form action. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (mobile.trim().length === 0) {
      setError('Enter your mobile identifier to continue.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(mobile.trim());
      dispatch({ type: 'setMobile', mobile: result.mobile });
      router.push('/otp');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to start verification.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <label htmlFor="mobile">Mobile identifier</label>
      <input
        aria-describedby={error ? 'mobile-error' : undefined}
        aria-invalid={Boolean(error)}
        aria-required="true"
        autoComplete="tel"
        id="mobile"
        name="mobile"
        onChange={(event) => setMobile(event.target.value)}
        placeholder="demo-actor"
        type="text"
        value={mobile}
      />
      {error ? <p className="form-error" id="mobile-error" role="alert">{error}</p> : null}
      <button className="button button-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Checking access…' : 'Continue to code'}
      </button>
      <p className="hint">Demo identifier: <strong>demo-actor</strong></p>
    </form>
  );
}
