import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { login, verify } from '../api/client';
import { JourneyProvider } from '../journey/JourneyProvider';
import { LoginForm } from './LoginForm';
import { OtpForm } from './OtpForm';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('../api/client', () => ({ login: vi.fn(), verify: vi.fn() }));

const push = vi.fn();
const mockedLogin = vi.mocked(login);
const mockedVerify = vi.mocked(verify);

/** Renders a client form inside its required state provider. */
function renderWithJourney(component: React.ReactNode) {
  return render(<JourneyProvider>{component}</JourneyProvider>);
}

describe('authentication forms', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows a mobile validation error without submitting', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
    const user = userEvent.setup();
    renderWithJourney(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Continue to code' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your mobile identifier');
  });

  it('shows a rejected login alert and lets the user recover with a successful retry', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
    mockedLogin
      .mockRejectedValueOnce(new Error('Access could not be started.'))
      .mockResolvedValueOnce({ accepted: true, mobile: 'demo-actor' });
    const user = userEvent.setup();
    renderWithJourney(<LoginForm />);

    await user.type(screen.getByLabelText('Mobile identifier'), 'demo-actor');
    await user.click(screen.getByRole('button', { name: 'Continue to code' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Access could not be started.');

    await user.click(screen.getByRole('button', { name: 'Continue to code' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to code' })).toBeEnabled();
  });

  it('shows the accepted access flow as submitting and returns to an enabled form', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
    let resolveLogin: (value: { accepted: boolean; mobile: string }) => void = () => undefined;
    mockedLogin.mockReturnValueOnce(new Promise((resolve) => {
      resolveLogin = resolve;
    }));
    const user = userEvent.setup();
    renderWithJourney(<LoginForm />);

    await user.type(screen.getByLabelText('Mobile identifier'), 'demo-actor');
    await user.click(screen.getByRole('button', { name: 'Continue to code' }));
    expect(screen.getByRole('button', { name: 'Checking access…' })).toBeDisabled();
    resolveLogin({ accepted: true, mobile: 'demo-actor' });
    expect(await screen.findByRole('button', { name: 'Continue to code' })).toBeEnabled();
  });

  it('shows an OTP error for a missing mobile journey', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
    const user = userEvent.setup();
    renderWithJourney(<OtpForm />);

    await user.type(screen.getByLabelText('One-time passcode'), '1234');
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Return to the identifier step');
  });

  it('renders the backend rejection alert for an incorrect OTP', async () => {
    vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
    mockedLogin.mockResolvedValue({ accepted: true, mobile: 'demo-actor' });
    mockedVerify.mockRejectedValue(new Error('The demo code was not accepted.'));
    const user = userEvent.setup();
    renderWithJourney(<><LoginForm /><OtpForm /></>);

    await user.type(screen.getByLabelText('Mobile identifier'), 'demo-actor');
    await user.click(screen.getByRole('button', { name: 'Continue to code' }));
    await user.type(screen.getByLabelText('One-time passcode'), '0000');
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The demo code was not accepted.');
    expect(screen.getByRole('button', { name: 'Verify and continue' })).toBeEnabled();
  });
});
