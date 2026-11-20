import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { Button } from '../components/common/Button';
import { QuickServiceModal } from '../components/cleaning/QuickServiceModal';
import {
  Sparkles, Building2, Calculator, ShieldCheck, Clock, ArrowRight, CheckCircle2,
  UtensilsCrossed, Shirt, Home, CalendarDays, Users, Brush,
  Wind, Leaf, Bug, Sofa, Grid2X2, Hammer, Droplets, ClipboardList, MapPin, HeartHandshake,
} from 'lucide-react';

const services = [
  { name: 'Ironing & dry cleaning', detail: 'Fresh clothes, neatly finished.', icon: Shirt },
  { name: 'Dusting', detail: 'Shelves, surfaces and those easy-to-miss corners.', icon: Brush },
  { name: 'Polishing', detail: 'Care for suitable furniture and hard surfaces.', icon: Sparkles },
  { name: 'Regular cleans', detail: 'A routine that works around your household.', icon: CalendarDays },
  { name: 'Vacuuming', detail: 'Everyday dust and debris, taken care of.', icon: Wind },
  { name: 'One-off cleans', detail: 'A fresh start for your living space.', icon: Home },
  { name: 'Landscaping', detail: 'Garden care and tidy outdoor spaces.', icon: Leaf },
  { name: 'Fumigation', detail: 'Specialist pest-control enquiries.', icon: Bug },
  { name: 'Carpet & rug washing', detail: 'Deeper care for the floors you love.', icon: Grid2X2 },
  { name: 'Upholstery cleaning', detail: 'Fabric-appropriate care for sofas and chairs.', icon: Sofa },
  { name: 'Post-construction cleaning', detail: 'Clear the dust after building or renovation.', icon: Hammer },
  { name: 'Kitchen & bathroom care', detail: 'Attention to the busiest rooms in your home.', icon: Droplets },
];
const plans = [
  { title: 'Regular domestic cleaning', tag: 'A little help, every week', icon: CalendarDays, text: 'Weekly or fortnightly visits built around your priorities. From dusting and vacuuming to kitchen care, create a routine that makes home easier to manage.', points: ['Agree your rooms, tasks and frequency', 'Discuss a consistent cleaner where available', 'Adjust your cleaning plan as your needs change'] },
  { title: 'One-off & deep cleaning', tag: 'Time for a fresh start', icon: Sparkles, text: 'A thorough clean for a seasonal refresh, a move, or the moments when your home needs extra attention. The scope depends on its size and condition.', points: ['Choose the areas that need extra care', 'Include suitable specialist add-ons', 'Review your quote before booking'] },
  { title: 'Dedicated house cleaner', tag: 'Ongoing support at home', icon: Users, text: 'Explore a long-term or permanent house-cleaner arrangement. Discuss your preferred hours, duties and household needs before agreeing a suitable placement.', points: ['Part-time or full-time requirements', 'Discuss experience and availability', 'Agree responsibilities before you start'] },
];
const benefits = [
  { icon: HeartHandshake, title: 'Your home, your priorities', text: 'Tell us what matters most, from a carefully cleaned kitchen to help keeping on top of weekly housework.' },
  { icon: ClipboardList, title: 'A clear scope from the start', text: 'Review the tasks, frequency and quoted price. Any extra work should be discussed before it is added.' },
  { icon: ShieldCheck, title: 'Confidence before the first visit', text: 'Ask about cleaner identity, references and suitability checks when discussing your arrangement.' },
  { icon: Leaf, title: 'Thoughtful care for your space', text: 'Share your product preferences, delicate surfaces, allergies and any special instructions in advance.' },
];
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setEnquiry = (kind: 'home' | 'commercial' | 'cleaner', service?: string) => navigate('/cleaning/enquiry/' + kind + (service ? '?service=' + encodeURIComponent(service) : ''));
  const [quickService, setQuickService] = useState<'dishwashing' | 'laundry' | null>(null);
  return (
    <CustomerLayout>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">
          <div className="px-5 sm:px-8 lg:pl-8 py-16 lg:py-24 space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300"><Sparkles className="w-4 h-4" /> A cleaner home. More time for you.</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">Leave the cleaning.<br /><span className="text-emerald-400">Love coming home.</span></h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-300">From everyday housework to a deep clean that makes all the difference. Find cleaning that fits your home, your routine and your life with Lofix.</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/cleaning')} rightIcon={<ArrowRight className="w-4 h-4" />}>Plan my clean</Button>
              <a href="#cleaning-services" className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold hover:bg-slate-800 focus-visible:outline-emerald-400">Explore services</a>
            </div>
            <div className="flex flex-wrap gap-5 border-t border-slate-800 pt-6 text-xs text-slate-300">
              {['One-off or regular visits', 'Tailored to your space', 'Quotes in naira'].map(text => <span key={text} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />{text}</span>)}
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-full">
            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=85" alt="Cleaner carefully wiping a surface at home" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-6 right-6 rounded-2xl border border-white/30 bg-white/95 p-5 text-slate-900 shadow-xl flex items-center gap-4">
              <div className="rounded-xl bg-emerald-100 p-3"><Home className="w-7 h-7 text-emerald-700" /></div>
              <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Room to breathe</p><p className="mt-1 font-semibold">Less housework. More of what matters.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
          <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Cleaning, made personal</p><h2 className="mt-3 text-3xl sm:text-4xl font-display font-bold text-slate-900">A little help at home.<br />A lot more time for life.</h2></div>
          <div className="space-y-4 text-slate-600 leading-relaxed"><p>Housework has a way of filling your free time. Lofix helps you make room for family, work and a well-earned break with cleaning tailored to the way you live.</p><p>Whether you need regular support or a single thorough visit, start with your space and priorities. We help you plan a clean around them.</p><a href="#why-lofix" className="inline-flex items-center gap-2 font-semibold text-emerald-700">Why choose a home cleaner? <ArrowRight className="w-4 h-4" /></a></div>
        </div>
      </section>

      <section id="cleaning-plans" className="bg-slate-50 border-y border-slate-200 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Find your fit</p>
          <h2 className="mt-3 text-3xl font-display font-bold text-slate-900">Your clean. Your kind of routine.</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-9">
            {plans.map(({ title, tag, icon: Icon, text, points }, index) => <article key={title} className={'rounded-2xl border p-6 sm:p-7 flex flex-col ' + (index === 2 ? 'bg-emerald-950 text-white border-emerald-900' : 'bg-white text-slate-900 border-slate-200')}>
              <Icon className={'w-8 h-8 mb-6 ' + (index === 2 ? 'text-emerald-300' : 'text-emerald-600')} />
              <p className={'text-xs font-semibold mb-2 ' + (index === 2 ? 'text-emerald-300' : 'text-emerald-700')}>{tag}</p>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className={'text-sm leading-relaxed mt-4 ' + (index === 2 ? 'text-emerald-100' : 'text-slate-600')}>{text}</p>
              <ul className="space-y-3 text-sm my-6">{points.map(point => <li key={point} className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />{point}</li>)}</ul>
              <div className="mt-auto pt-5 border-t border-emerald-500/20"><p className="text-xs mb-4">Priced for your scope, location and schedule.</p><Button className="w-full" onClick={() => index === 2 ? setEnquiry('home', 'Dedicated / permanent house cleaner') : navigate('/cleaning')}>{index === 2 ? 'Explore a dedicated cleaner' : 'Get a cleaning estimate'}</Button></div>
            </article>)}
          </div>
        </div>
      </section>

      <section id="cleaning-services" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 scroll-mt-24">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">More than the everyday clean</p><h2 className="mt-3 text-3xl font-display font-bold text-slate-900">A little care for every corner.</h2><p className="mt-4 text-slate-600">Explore our cleaning and home-care services. Specialist work is subject to assessment and local availability.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-9">
          {services.map(({ name, detail, icon: Icon }) => <article key={name} className="rounded-2xl border border-slate-200 p-5 bg-white motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300"><div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon className="w-6 h-6" /></div><h3 className="mt-4 font-bold text-sm text-slate-900">{name}</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">{detail}</p><button onClick={() => setEnquiry('home', name)} className="mt-4 text-xs font-bold text-emerald-700 underline underline-offset-4">Enquire about this service</button></article>)}
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[{ type: 'dishwashing' as const, title: 'Just the dishes?', text: 'Get help with washing up, without booking a full home clean.', icon: UtensilsCrossed }, { type: 'laundry' as const, title: 'Laundry piling up?', text: 'Arrange our existing wash-and-spin service for your clothes.', icon: Shirt }].map(({ type, title, text, icon: Icon }) => <div key={type} className="rounded-2xl bg-slate-50 p-6 flex items-start gap-4"><Icon className="w-7 h-7 shrink-0 text-emerald-700" /><div><h3 className="font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-600 mt-1">{text}</p><button onClick={() => setQuickService(type)} className="mt-3 text-sm text-emerald-700 font-bold underline underline-offset-4">Arrange {type}</button></div></div>)}
        </div>
      </section>

      <section id="commercial-cleaning" className="bg-slate-950 text-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid lg:grid-cols-2 gap-12">
          <div><Building2 className="w-10 h-10 text-emerald-400 mb-6" /><p className="text-xs uppercase tracking-widest text-emerald-300 font-bold">For businesses & organisations</p><h2 className="text-3xl sm:text-4xl font-display font-bold mt-3">Big spaces.<br />A considered cleaning plan.</h2><p className="text-slate-300 leading-relaxed mt-5">Offices, residential estates, schools, retail spaces and facilities each need a different approach. Share your requirements for contract cleaning, a formal quotation, or an invitation to tender.</p><div className="flex flex-wrap gap-2 my-6">{['Office & facility cleaning', 'Contract housekeeping', 'Post-construction', 'Tender / RFQ'].map(item => <span key={item} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">{item}</span>)}</div><Button onClick={() => setEnquiry('commercial')} rightIcon={<ArrowRight className="w-4 h-4" />}>Request a quotation</Button></div>
          <div className="space-y-4">{[
            ['01', 'Tell us about the site', 'Outline your location, floor area, cleaning frequency, scope and tender deadline.'],
            ['02', 'Discuss a site assessment', 'Review access, staffing, materials and specialist requirements before pricing.'],
            ['03', 'Agree a written proposal', 'Set out the cleaning schedule, deliverables and costs for your review.'],
          ].map(([number, title, text]) => <div key={number} className="flex gap-5 rounded-2xl border border-slate-700 bg-slate-900 p-6"><span className="text-2xl font-bold text-emerald-400">{number}</span><div><h3 className="font-bold">{title}</h3><p className="text-sm text-slate-400 mt-2 leading-relaxed">{text}</p></div></div>)}</div>
        </div>
      </section>

      <section id="why-lofix" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto"><p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Thoughtful service, from the start</p><h2 className="text-3xl font-display font-bold text-slate-900 mt-3">Built around your peace of mind.</h2><p className="mt-4 text-slate-600">A good clean starts with listening. Your preferences, comfort and household routine shape the service you choose.</p></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">{benefits.map(({ icon: Icon, title, text }) => <div key={title}><Icon className="w-7 h-7 text-emerald-600 mb-4" /><h3 className="font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-600 leading-relaxed mt-3">{text}</p></div>)}</div>
        <div className="mt-12 rounded-2xl bg-emerald-50 border border-emerald-100 p-6 sm:p-8 grid md:grid-cols-2 gap-6"><div className="flex gap-4"><MapPin className="w-7 h-7 shrink-0 text-emerald-700" /><div><h3 className="font-bold text-slate-900">Start with your neighbourhood</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">Share your city, area and property details so we can discuss local availability and a suitable cleaning arrangement.</p><button onClick={() => setEnquiry('home')} className="mt-3 text-emerald-700 text-sm font-bold underline underline-offset-4">Enquire about home cleaning</button></div></div><div><h3 className="font-bold text-slate-900">At home or out for the day?</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">Tell us your preferred access arrangement. Any key handling should be agreed and documented before a visit, so everyone knows how your home will be accessed and secured.</p></div></div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        <div className="rounded-3xl bg-emerald-700 text-white p-8 sm:p-12 flex flex-col md:flex-row md:items-center gap-8 justify-between">
          <div className="max-w-xl"><Clock className="w-9 h-9 text-emerald-200 mb-4" /><h2 className="text-3xl font-display font-bold">Not sure where to start?</h2><p className="text-emerald-50 leading-relaxed mt-3">Tell us about your rooms and cleaning needs in our calculator. Review a cleaning estimate and plan the right service for your home.</p><p className="mt-3 text-xs text-emerald-100">Visit duration depends on the scope and condition of your property.</p></div>
          <Button variant="secondary" size="lg" className="shrink-0" onClick={() => navigate('/cleaning')} leftIcon={<Calculator className="w-5 h-5" />}>Calculate my time</Button>
        </div>
      </section>

      <section id="become-a-cleaner" className="bg-slate-50 border-y border-slate-200 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl bg-emerald-100 p-10 sm:p-14 text-emerald-950"><Users className="w-16 h-16 mb-8 text-emerald-700" /><p className="text-3xl sm:text-4xl font-display font-bold leading-tight">Good at cleaning?<br />Bring your care<br />to someone's home.</p><p className="mt-6 text-sm">Domestic cleaning · Housekeeping · Specialist services</p></div>
          <div><p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Work with Lofix</p><h2 className="text-3xl font-display font-bold text-slate-900 mt-3">Become a cleaning agent.</h2><p className="text-slate-600 leading-relaxed mt-5">Apply to join Lofix as a cleaning agent. Share your experience, preferred work areas and availability for review by our team.</p><ol className="my-6 space-y-3 text-sm text-slate-700">{['Tell us about yourself and your skills', 'Discuss suitability and verification with our team', 'Receive an update before any onboarding'].map((item, i) => <li key={item} className="flex gap-3"><span className="rounded-full bg-emerald-100 text-emerald-800 w-6 h-6 flex items-center justify-center shrink-0 font-bold">{i + 1}</span>{item}</li>)}</ol><Button onClick={() => setEnquiry('cleaner')}>Apply to become a cleaner</Button></div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-8">A few things you might be wondering.</h2>
        {[
          ['How often should I book a cleaner?', 'Choose weekly or fortnightly support for ongoing housework, or a one-off clean for a specific occasion. The right frequency depends on your household, space and priorities.'],
          ['Can I request the same cleaner?', 'You can discuss a consistent cleaner for regular visits. Availability and the final arrangement should be confirmed before you book.'],
          ['How much will my clean cost?', 'Use the cleaning calculator for a quote based on your property and selected services. Dedicated cleaner placements and commercial contracts need a tailored discussion.'],
          ['Are specialist services available everywhere?', 'Availability varies by location and job requirements. Services such as fumigation, landscaping and upholstery care need their scope and suitability confirmed first.'],
        ].map(([question, answer]) => <details key={question} className="group border-b border-slate-200 py-5"><summary className="cursor-pointer font-semibold text-slate-900">{question}</summary><p className="mt-3 text-sm leading-relaxed text-slate-600">{answer}</p></details>)}
        <Link to="/faqs" className="inline-flex gap-2 items-center text-emerald-700 font-bold text-sm mt-6">More frequently asked questions <ArrowRight className="w-4 h-4" /></Link>
      </section>

      <QuickServiceModal isOpen={quickService !== null} serviceType={quickService || 'dishwashing'} onClose={() => setQuickService(null)} />
    </CustomerLayout>
  );
};

export default LandingPage;
