import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ClipboardList, ShieldCheck } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Button } from '../../components/common/Button';
import { AuthModals } from '../../components/auth/AuthModals';
import { useAuth } from '../../context/AuthContext';
import { cleaningIntakeApi, CleanerApplication } from '../../api/cleaningIntake';

const control = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50';
export const CleaningEnquiryPage: React.FC = () => {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const client = useQueryClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState<number | null>(null);
  const cleaner = kind === 'cleaner';
  const commercial = kind === 'commercial';
  const title = cleaner ? 'Become a Lofix cleaning agent' : commercial ? 'Request a commercial quotation' : 'Plan your home cleaning';

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || reference) return;
    if (!isAuthenticated) { setAuthOpen(true); return; }
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) || '').trim();
    const contact = { fullName: value('fullName'), phone: value('phone'), email: value('email'), area: value('area'), notes: value('notes'), consent: data.get('consent') === 'on' };
    setPending(true); setError('');
    try {
      const result = cleaner
        ? await cleaningIntakeApi.apply({ ...contact, experience: value('experience') as CleanerApplication['experience'], availability: value('availability') as CleanerApplication['availability'] })
        : await cleaningIntakeApi.request({
          ...contact, kind: commercial ? 'commercial' : 'home', service: value('service'), propertySize: value('propertySize'), schedule: value('schedule'),
          ...(commercial ? { organisation: value('organisation'), ...(value('deadline') ? { deadline: value('deadline') } : {}), ...(value('documentUrl') ? { documentUrl: value('documentUrl') } : {}) } : {}),
        });
      setReference(result.ticket.id);
      void client.invalidateQueries({ queryKey: ['contact-messages'] });
    } catch (failure: unknown) {
      const response = failure as { response?: { status?: number; data?: { message?: string } } };
      setError(response.response?.status === 429 ? 'You have sent several requests recently. Please wait 15 minutes and try again.' : response.response?.data?.message || 'We could not submit your details. Your entries are still here; please try again.');
    } finally { setPending(false); }
  };
  if (!['home', 'commercial', 'cleaner'].includes(kind || '')) return <CustomerLayout><div className="max-w-3xl mx-auto p-12"><h1>Enquiry type not found</h1><Link to="/" className="text-emerald-700 underline">Return home</Link></div></CustomerLayout>;

  return <CustomerLayout>
    <section className="bg-slate-950 text-white px-5 py-12">
      <div className="max-w-5xl mx-auto"><Link to="/" className="inline-flex gap-2 items-center text-sm text-emerald-300"><ArrowLeft className="w-4 h-4" /> Back to cleaning services</Link><h1 className="mt-6 text-3xl sm:text-4xl font-bold">{title}</h1><p className="mt-4 max-w-2xl text-slate-300">{cleaner ? 'Tell our team about your skills and availability. Applications are reviewed before an agent profile is created.' : 'Share the details below. Our team will review your requirements and reply through your Lofix account.'}</p></div>
    </section>
    <section className="max-w-5xl mx-auto px-5 py-12 grid lg:grid-cols-[1fr_280px] gap-8">
      {reference ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8"><CheckCircle2 className="w-12 h-12 text-emerald-600" /><h2 className="text-2xl font-bold mt-4">{cleaner ? 'Application received' : 'Enquiry received'}</h2><p className="mt-3">Your reference is #{reference}. Our team will review your details. Replies and updates will appear in your account notifications.</p><Link to={`/contact?message=${reference}`} className="inline-block mt-6 font-bold text-emerald-800 underline">Track this {cleaner ? 'application' : 'enquiry'}</Link></div> :
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        {!isAuthenticated && <div className="rounded-xl bg-emerald-50 p-4 text-sm"><p>Sign in or create a customer account so you can receive replies and track your request.</p><button type="button" onClick={() => setAuthOpen(true)} className="font-bold text-emerald-800 underline mt-2">Sign in / create account</button></div>}
        <fieldset disabled={pending} className="grid sm:grid-cols-2 gap-5">
          <legend className="font-bold text-lg mb-5">Your contact details</legend>
          <label className="text-sm font-medium">Full name<input name="fullName" required minLength={2} maxLength={100} defaultValue={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''} autoComplete="name" className={control} /></label>
          <label className="text-sm font-medium">Phone number<input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={user?.phoneNumber || ''} autoComplete="tel" className={control} /></label>
          <label className="text-sm font-medium">Email address<input name="email" type="email" required maxLength={254} defaultValue={user?.email || ''} autoComplete="email" className={control} /></label>
          <label className="text-sm font-medium">City / area<input name="area" required minLength={2} maxLength={150} placeholder="e.g. Lekki, Lagos" className={control} /></label>
          {cleaner ? <>
            <label className="text-sm font-medium">Cleaning experience<select name="experience" className={control}><option value="NEW">New to professional cleaning</option><option value="UNDER_ONE_YEAR">Less than 1 year</option><option value="ONE_TO_THREE_YEARS">1–3 years</option><option value="OVER_THREE_YEARS">More than 3 years</option></select></label>
            <label className="text-sm font-medium">Availability<select name="availability" className={control}><option value="PART_TIME">Part-time</option><option value="FULL_TIME">Full-time</option><option value="WEEKENDS">Weekends</option></select></label>
          </> : <>
            <label className="text-sm font-medium">{commercial ? 'Service / enquiry type' : 'Cleaning service'}<input name="service" required maxLength={100} defaultValue={params.get('service') || (commercial ? 'Commercial cleaning quotation' : 'Regular home cleaning')} className={control} /></label>
            <label className="text-sm font-medium">Property size<input name="propertySize" required maxLength={100} placeholder={commercial ? 'Approximate floor area (m²)' : 'e.g. 3 bedrooms, 2 bathrooms'} className={control} /></label>
            <label className="text-sm font-medium sm:col-span-2">Preferred schedule / frequency<input name="schedule" required maxLength={150} placeholder="e.g. weekly, weekday mornings" className={control} /></label>
          </>}
          {commercial && <>
            <label className="text-sm font-medium">Organisation<input name="organisation" required maxLength={150} className={control} /></label>
            <label className="text-sm font-medium">Tender deadline (optional)<input name="deadline" type="date" className={control} /></label>
            <label className="text-sm font-medium sm:col-span-2">Scope or tender document link (optional)<input name="documentUrl" type="url" pattern="https://.*" maxLength={1000} placeholder="https://…" className={control} /><span className="text-xs text-slate-500 block mt-2">Share an HTTPS link our team can access. You can also describe the scope below.</span></label>
          </>}
          <label className="text-sm font-medium sm:col-span-2">{cleaner ? 'Skills, experience and preferred work areas' : 'Requirements, site address and any access instructions'}<textarea name="notes" required minLength={10} maxLength={2000} rows={5} className={control} /></label>
          <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-600"><input name="consent" type="checkbox" required className="mt-1 accent-emerald-600" /><span>I agree that Lofix may use these details to review my {cleaner ? 'application' : 'enquiry'} and contact me. <Link to="/privacy" className="underline text-emerald-700">Privacy policy</Link></span></label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" isLoading={pending} className="w-full">{isAuthenticated ? cleaner ? 'Submit application' : 'Send enquiry' : 'Sign in to submit'}</Button>
      </form>}
      <aside className="space-y-5"><div className="rounded-2xl bg-slate-50 border p-6"><ClipboardList className="text-emerald-700 w-8 h-8" /><h2 className="font-bold mt-4">What happens next?</h2><ol className="list-decimal pl-5 mt-4 space-y-3 text-sm text-slate-600"><li>Our team reviews your details.</li><li>{cleaner ? 'We discuss your experience and suitability.' : 'We discuss the scope and arrange an assessment if needed.'}</li><li>{cleaner ? 'An admin handles onboarding and verification.' : 'You receive the next steps or a tailored quotation.'}</li></ol></div><div className="p-6 text-sm text-slate-600"><ShieldCheck className="text-emerald-700 mb-3" />{cleaner ? 'Applying does not automatically create an agent profile or guarantee work.' : 'Sending an enquiry does not book a visit or charge you.'}</div><Link to="/contact" className="block text-sm font-bold text-emerald-700 px-6">View my enquiries & applications →</Link></aside>
    </section>
    <AuthModals isOpen={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} onSwitchMode={setAuthMode} />
  </CustomerLayout>;
};
