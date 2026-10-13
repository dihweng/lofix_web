import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { authApi } from '../../api/auth';
import { EmailVerificationPage } from '../../pages/EmailVerificationPage';

const authMocks = vi.hoisted(() => ({
  completePhoneVerification: vi.fn(),
}));

vi.mock('../../components/layout/CustomerLayout', () => ({
  CustomerLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => authMocks,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

it('verifies the token from the email link and guides the user to sign in', async () => {
  const verifyEmail = vi.spyOn(authApi, 'verifyEmail').mockResolvedValue({
    message: 'Verification successful, you can now login',
  });

  render(
    <MemoryRouter initialEntries={[{
      pathname: '/account/verify-email',
      search: '?token=mail-token',
      state: {
        email: 'jane@example.com',
        phoneNumber: '08012345678',
        registrationMessage: 'Registration received. Check your phone and email.',
      },
    }]}>
      <Routes>
        <Route path="/account/verify-email" element={<EmailVerificationPage />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByLabelText(/email verification token/i)).toHaveValue('mail-token');
  expect(screen.getByText(/we sent an email verification link to jane@example.com/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/registered phone number/i)).toHaveValue('08012345678');
  fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

  await waitFor(() => expect(verifyEmail).toHaveBeenCalledWith('mail-token'));
  expect(await screen.findByText(/your email has been verified successfully.*now verify your phone/i)).toBeInTheDocument();
});

it('submits the phone token and phone number, then stores the API-issued session', async () => {
  const account = {
    id: 7,
    role: 'User' as const,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    jwtToken: 'post-verification-token',
  };
  const verifyPhone = vi.spyOn(authApi, 'verifyPhone').mockResolvedValue(account);

  render(
    <MemoryRouter initialEntries={['/account/verify-email']}>
      <Routes>
        <Route path="/account/verify-email" element={<EmailVerificationPage />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/registered phone number/i), {
    target: { value: '08012345678' },
  });
  fireEvent.change(screen.getByLabelText(/sms verification code/i), {
    target: { value: '445566' },
  });
  fireEvent.click(screen.getByRole('button', { name: /verify phone/i }));

  await waitFor(() => {
    expect(verifyPhone).toHaveBeenCalledWith('445566', '08012345678');
    expect(authMocks.completePhoneVerification).toHaveBeenCalledWith(account);
  });
  expect(await screen.findByText(/your phone is verified and you are signed in/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /continue to your dashboard/i })).toHaveAttribute('href', '/dashboard');
});
