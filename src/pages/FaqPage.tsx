import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { faqsApi, type FaqEntry } from '../api/faqs';
import { CustomerLayout } from '../components/layout/CustomerLayout';

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    faqsApi.list()
      .then(items => { if (active) setFaqs(items); })
      .catch(() => { if (active) setError('We could not load the FAQs. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(faqs.map(item => item.details?.category || 'General')))], [faqs]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return faqs.filter(item => {
      const itemCategory = item.details?.category || 'General';
      return (category === 'All' || itemCategory === category) && (!term || `${item.title} ${item.body}`.toLowerCase().includes(term));
    });
  }, [faqs, category, query]);

  return (
    <CustomerLayout>
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <HelpCircle className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h1 className="text-3xl font-black sm:text-4xl">How can we help?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">Answers about Lofix cleaning, bookings, payments, utilities and support.</p>
          <label className="mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-900 shadow-xl">
            <Search className="h-5 w-5 text-slate-400" />
            <span className="sr-only">Search frequently asked questions</span>
            <input value={query} onChange={event => setQuery(event.target.value)} className="w-full border-0 bg-transparent text-sm outline-none" placeholder="Search for a question..." />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-2" aria-label="FAQ categories">
          {categories.map(item => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}>{item}</button>
          ))}
        </div>

        {loading && <p className="py-12 text-center text-sm text-slate-500">Loading answers…</p>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {!loading && !error && filtered.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No matching questions were found.</p>}
        <div className="space-y-3">
          {filtered.map(item => {
            const open = openId === item.id;
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <h2><button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50"><span>{item.title}</span><ChevronDown className={`h-5 w-5 flex-none text-emerald-600 transition-transform ${open ? 'rotate-180' : ''}`} /></button></h2>
                {open && <div className="whitespace-pre-line border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600">{item.body}</div>}
              </article>
            );
          })}
        </div>
      </section>
    </CustomerLayout>
  );
};
