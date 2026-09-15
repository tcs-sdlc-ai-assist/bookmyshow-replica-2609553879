'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { verify } from '../api/client';
import { useJourney } from '../journey/JourneyProvider';

/** Collects a one-time passcode and stores only the backend-issued token. */
export function OtpForm() {
  const router = useRouter();
  const { dispatch, state } = useJourney();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Verifies the code only after the user selects the named submit action. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (state.mobile.length === 0) {
      setError('Return to the identifier step before entering a code.');
      return;
    }
    if (otp.trim().length === 0) {
      setError('Enter the one-time passcode to continue.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await verify(state.mobile, otp.trim());
      dispatch({ type: 'setVerificationToken', token: result.token });
      router.push('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to verify this code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <label htmlFor="otp">One-time passcode</label>
      <input
        aria-describedby={error ? 'otp-error' : undefined}
        aria-invalid={Boolean(error)}
        aria-required="true"
        autoComplete="one-time-code"
        id="otp"
        inputMode="numeric"
        name="otp"
        onChange={(event) => setOtp(event.target.value)}
        placeholder="1234"
        type="text"
        value={otp}
      />
      {error ? <p className="form-error" id="otp-error" role="alert">{error}</p> : null}
      <button className="button button-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Verifying…' : 'Verify and continue'}
      </button>
      <p className="hint">Demo code: <strong>1234</strong></p>
    </form>
  );
}
