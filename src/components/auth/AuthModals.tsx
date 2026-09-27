import React, { useState } from 'react';
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
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
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

    setIsLoading(true);
    try {
      await register({
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        password: regPassword,
        confirmPassword,
        role: 'User',
      });
      onClose();
      resetState();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
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
