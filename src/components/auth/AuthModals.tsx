import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalsProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  mode,
  onClose,
  onSwitchMode,
}) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setErrorMsg(null);
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
      onClose();
      resetState();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setErrorMsg(
        message === 'Email or password is incorrect'
          ? 'Email or password is incorrect, or your account is not verified. Complete the email and phone verification steps sent during registration.'
          : message || 'Login failed. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !phoneNumber.trim()) {
      setErrorMsg('Please fill in all required contact information.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setErrorMsg('Please accept the Terms of Service to create an account.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        password: regPassword,
        confirmPassword,
        acceptTerms: true,
      });
      onClose();
      navigate('/account/verify-email', {
        state: {
          email: regEmail.trim(),
          phoneNumber: phoneNumber.trim(),
          registrationMessage: result.message,
        },
      });
    } catch (err: unknown) {
      const responseMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMsg(responseMessage || (err instanceof Error ? err.message : 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
      maxWidth="md"
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>

          <button type="button" className="w-full text-sm text-emerald-700 underline" onClick={() => { onClose(); navigate('/account/forgot-password'); }}>Forgot password?</button>
          <p className="text-center text-xs text-slate-600">
            Read our <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">Terms and Conditions</a> and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">Privacy Policy</a> (opens in a new tab).
          </p>
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>New to Lofix? </span>
            <button
              type="button"
              onClick={() => {
                resetState();
                onSwitchMode('register');
              }}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Create an account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              options={[
                { value: 'Mr', label: 'Mr.' },
                { value: 'Mrs', label: 'Mrs.' },
                { value: 'Ms', label: 'Ms.' },
                { value: 'Dr', label: 'Dr.' },
              ]}
            />
            <div className="col-span-2">
              <Input
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>
          </div>

          <Input
            label="Last Name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            placeholder="john.doe@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08012345678"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Password"
              type="password"
              required
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="mt-0.5"
            />
            <span>
              I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">Terms and Conditions</a>.{' '}
              Read our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">Privacy Policy</a> (opens in a new tab).
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3"
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Create Customer Account
          </Button>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Already have a Lofix account? </span>
            <button
              type="button"
              onClick={() => {
                resetState();
                onSwitchMode('login');
              }}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Sign In
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
