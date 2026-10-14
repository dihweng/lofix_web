import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { AuthModals } from '../components/auth/AuthModals';

export function PasswordRecoveryPage() {
  const [params, setParams] = useSearchParams();
  const [token, setToken] = useState(() => params.get('token') || '');
  const [step, setStep] = useState<'email' | 'token' | 'password' | 'done'>(() => params.has('token') ? 'token' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [login, setLogin] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (step === 'password' && (password.length < 6 || password !== confirmPassword)) {
      setError('Use at least six characters and matching passwords.'); return;
    }
    setBusy(true);
    try {
      if (step === 'email') {
        const result = await authApi.forgotPassword(email.trim());
        setMessage(result.message); setStep('token');
      } else if (step === 'token') {
        await authApi.validateResetToken(token.trim());
        setParams({}, { replace: true });
        setMessage('Email reset token verified. Choose a new password.'); setStep('password');
      } else if (step === 'password') {
        const result = await authApi.resetPassword({ token: token.trim(), password, confirmPassword });
        setToken(''); setPassword(''); setConfirmPassword('');
        setMessage(result.message); setStep('done');
      }
    } catch (err: unknown) {
      const value = err as { response?: { data?: { message?: string } }; message?: string };
      setError(value.response?.data?.message || value.message || 'Unable to complete password recovery. Please try again.');
    } finally { setBusy(false); }
  }
  const inputClass = 'mt-1 mb-4 w-full rounded-lg border border-slate-300 p-3';
  return <main className="min-h-screen bg-slate-50 px-4 py-16">
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
      <Link to="/" className="text-emerald-700 underline">Back to Lofix</Link>
      <h1 className="my-4 text-2xl font-bold">Reset your password</h1>
      <p className="mb-4 text-sm text-slate-600">Enter your registered email address to receive a password-reset link. Open the link in your email, or paste the reset token from that email below.</p>
      {message && <p role="status" className="mb-4 text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {step !== 'done' && <form onSubmit={submit}>
        {step === 'email' && <label>Email address<input className={inputClass} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
        {step === 'token' && <label>Email reset token<input className={inputClass} autoComplete="off" required value={token} onChange={e => setToken(e.target.value)} /></label>}
        {step === 'password' && <><label>New password<input className={inputClass} type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirm password<input className={inputClass} type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label></>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-700 p-3 text-white disabled:opacity-50">{busy ? 'Please wait…' : step === 'email' ? 'Send reset email' : step === 'token' ? 'Verify email reset token' : 'Save new password'}</button>
      </form>}
      {step !== 'email' && step !== 'done' && <button disabled={busy} className="mt-4 text-emerald-700 underline" onClick={() => { setStep('email'); setMessage(''); setError(''); setPassword(''); setConfirmPassword(''); }}>Request another reset email</button>}
      {step === 'done' && <button className="rounded-lg bg-emerald-700 p-3 text-white" onClick={() => setLogin(true)}>Sign in</button>}
    </section>
    <AuthModals isOpen={login} mode="login" onClose={() => setLogin(false)} onSwitchMode={() => setLogin(false)} />
  </main>;
}
