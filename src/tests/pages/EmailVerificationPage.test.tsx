import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { authApi } from '../../api/auth';
import { EmailVerificationPage } from '../../pages/EmailVerificationPage';

const HomeState = () => {
  const location = useLocation();
  return <output data-testid="home-state">{JSON.stringify(location.state)}</output>;
};

vi.mock('../../components/layout/CustomerLayout', () => ({
  CustomerLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
afterEach(() => {
  vi.restoreAllMocks();
});

it('verifies the token then returns home with the login handoff', async () => {
  const verifyEmail = vi.spyOn(authApi, 'verifyEmail').mockResolvedValue({
    message: 'Verification successful, you can now login',
  });

  render(
    <MemoryRouter initialEntries={[{
      pathname: '/account/verify-email',
      search: '?token=mail-token',
      state: {
        email: 'jane@example.com',
        registrationMessage: 'Registration received. Check your email.',
      },
    }]}>
      <Routes>
        <Route path="/account/verify-email" element={<EmailVerificationPage />} />
        <Route path="/" element={<HomeState />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByLabelText(/email verification code/i)).toHaveValue('mail-token');
  expect(screen.getByText(/we sent an email verification link to jane@example.com/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/registered phone number/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

  await waitFor(() => expect(verifyEmail).toHaveBeenCalledWith('mail-token'));
  expect(JSON.parse((await screen.findByTestId('home-state')).textContent || '{}')).toEqual({
    openAuth: 'login',
    authNotice: 'Your email has been verified successfully. Sign in with your email and password.',
    postLoginPath: '/dashboard',
  });
});
