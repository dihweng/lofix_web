import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { supportApi } from '../api/support';
import { ContactHistory } from '../components/support/ContactHistory';
import { useQueryClient } from '@tanstack/react-query';

export const ContactPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setError(''); setSuccess('');
    if (!subject.trim() || !message.trim()) { setError('Please enter a subject and message.'); return; }
    setSending(true);
    try {
      const result = await supportApi.sendMessage({ subject: subject.trim(), message: message.trim() });
      setSuccess(result.message);
      queryClient.invalidateQueries({ queryKey: ['contact-messages', user?.id] });
      setSubject(''); setMessage('');
    } catch (failure: any) {
      setError(failure.response?.data?.message || 'We could not send your message. Please try again or use another contact option below.');
    } finally { setSending(false); }
  };
  return <CustomerLayout>
    <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <p className="text-sm font-semibold text-emerald-700">We're here to help</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Contact Support</h1>
      <p className="mt-3 text-slate-600">Send us a message here, or choose the contact option that works for you.</p>
      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <a href="https://wa.me/2349099474330" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 hover:bg-emerald-100">
          <MessageCircle className="mb-3 h-6 w-6" /><h2 className="font-semibold">WhatsApp</h2><p className="mt-1 text-sm">Chat with us on WhatsApp</p>
        </a>
        <a href="tel:+2349099474330" className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50">
          <Phone className="mb-3 h-6 w-6 text-emerald-700" /><h2 className="font-semibold">Call us</h2><p className="mt-1 text-sm">0909 947 4330</p>
        </a>
        <a href="mailto:support@lofix.ng" className="rounded-2xl border border-slate-200 p-5 hover:bg-slate-50">
          <Mail className="mb-3 h-6 w-6 text-emerald-700" /><h2 className="font-semibold">Email us</h2><p className="mt-1 text-sm">support@lofix.ng</p>
        </a>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Send a message</h2>
        {isAuthenticated ? <>
          <p className="mt-2 text-sm text-slate-600">Read our replies here and look for updates in your notification bell. Include your booking or order reference if you have one.</p>
          {success && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-800">{success}</p>}
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
          <form onSubmit={submit} className="mt-6 space-y-5">
            <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={150} disabled={sending} required />
            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold uppercase text-slate-700 mb-2">Your message</label>
              <textarea id="contact-message" value={message} onChange={e => setMessage(e.target.value)} maxLength={3000} rows={6} required disabled={sending} className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="mt-1 text-xs text-slate-500">{message.length}/3,000 characters. Do not include passwords or payment card details.</p>
            </div>
            <Button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send message'}</Button>
          </form>
        </> : <p className="mt-3 text-slate-600"><Link className="font-semibold text-emerald-700 underline" to="/" state={{ openAuth: 'login', postLoginPath: '/contact' }}>Sign in to send a message</Link>, or contact us using WhatsApp, phone, or email above.</p>}
      </div>
      {isAuthenticated && user && <ContactHistory key={user.id} accountId={user.id} />}
      <p className="mt-6 text-sm text-slate-600">Looking for a quick answer? <Link to="/faqs" className="text-emerald-700 underline">Browse our FAQs</Link>.</p>
    </section>
  </CustomerLayout>;
};
