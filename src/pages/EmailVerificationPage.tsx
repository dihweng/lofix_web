import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import { authApi } from '../api/auth';
import { Input } from '../components/common/Input';
import { CustomerLayout } from '../components/layout/CustomerLayout';

export const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const registrationState = location.state as {
    email?: string;
    registrationMessage?: string;
  } | null;
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!token.trim()) {
      setErrorMessage('Enter the verification token from your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyEmail(token.trim());
      navigate('/', {
        replace: true,
        state: {
          openAuth: 'login',
          authNotice: 'Your email has been verified successfully. Sign in with your email and password.',
          postLoginPath: '/dashboard',
        },
      });
    } catch (error: unknown) {
      const responseMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMessage(responseMessage || (error instanceof Error ? error.message : 'Email verification failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            {registrationState?.registrationMessage
              ? `${registrationState.registrationMessage} `
              : ''}
            {registrationState?.email
              ? `We sent an email verification link to ${registrationState.email}. `
              : ''}
            Open the link in your email to confirm your address and activate your account.
          </p>

          {errorMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email verification token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-base font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Email'}
              </button>
          </form>
        </div>
      </section>
    </CustomerLayout>
  );
};
