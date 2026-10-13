import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { authApi } from '../api/auth';
import { Input } from '../components/common/Input';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { useAuth } from '../context/AuthContext';

export const EmailVerificationPage: React.FC = () => {
  const { completePhoneVerification } = useAuth();
  const location = useLocation();
  const registrationState = location.state as {
    email?: string;
    phoneNumber?: string;
    registrationMessage?: string;
  } | null;
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(registrationState?.phoneNumber || '');
  const [phoneToken, setPhoneToken] = useState('');
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    if (!token.trim()) {
      setErrorMessage('Enter the verification token from your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyEmail(token.trim());
      setMessage('Your email has been verified successfully.');
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

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPhoneError(null);
    setPhoneMessage(null);
    setIsPhoneSubmitting(true);
    try {
      const account = await authApi.verifyPhone(phoneToken.trim(), phoneNumber.trim());
      completePhoneVerification(account);
      setPhoneMessage('Your phone is verified and you are signed in.');
    } catch (error: unknown) {
      const responseMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setPhoneError(responseMessage || (error instanceof Error ? error.message : 'Phone verification failed. Please try again.'));
    } finally {
      setIsPhoneSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {message ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            {registrationState?.registrationMessage
              ? `${registrationState.registrationMessage} `
              : ''}
            {registrationState?.email
              ? `We sent an email verification link to ${registrationState.email}. `
              : ''}
            Open the link in your email to confirm your address. You must also verify your phone before your first sign-in.
          </p>

          {errorMessage && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {message ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
                {message} Now verify your phone using the SMS code below. Phone verification activates your account and signs you in.
              </p>
            </div>
          ) : (
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
          )}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Verify your phone</h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter the phone number used during registration and the SMS code. Successful phone verification returns the customer session.
          </p>

          {phoneError && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{phoneError}</span>
            </div>
          )}

          {phoneMessage ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
                {phoneMessage}
              </p>
              <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-base font-medium text-white hover:bg-emerald-700"
              >
                Continue to your dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-4">
              <Input
                label="Registered phone number"
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
              <Input
                label="SMS verification code"
                autoComplete="one-time-code"
                value={phoneToken}
                onChange={(event) => setPhoneToken(event.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isPhoneSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-800 px-5 py-2.5 text-base font-medium text-white disabled:opacity-60"
              >
                {isPhoneSubmitting ? 'Verifying...' : 'Verify Phone'}
              </button>
            </form>
          )}
        </div>
      </section>
    </CustomerLayout>
  );
};
