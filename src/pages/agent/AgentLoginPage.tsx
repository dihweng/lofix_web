import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Wrench, Lock, Mail, AlertCircle } from 'lucide-react';

export const AgentLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAgentAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/agent', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        setErrorMessage(res?.data?.message || 'Authentication failed. Check your credentials.');
      } else {
        setErrorMessage('Authentication failed. Check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="p-8 bg-slate-950 border-b border-slate-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/30 mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">LOFIX AGENT PORTAL</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in with your Agent account credentials</p>
        </div>

        <div className="p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="agent@lofix.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              isLoading={isSubmitting}
            >
              Sign In to Agent Portal
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            Authorized Lofix Field & Rental Agents Only
          </div>
        </div>
      </div>
    </div>
  );
};
