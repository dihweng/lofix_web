import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { QuickServiceModal } from '../components/cleaning/QuickServiceModal';
import {
  Sparkles,
  Building2,
  Calculator,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  Shirt,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [quickServiceModal, setQuickServiceModal] = useState<{
    isOpen: boolean;
    type: 'dishwashing' | 'laundry';
  }>({ isOpen: false, type: 'dishwashing' });

  return (
    <CustomerLayout>
      <section className="relative bg-slate-950 text-white overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Nigeria's Premier Homes & Services Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight font-display text-white">
              Luxury Shortlets, <span className="text-emerald-400 underline decoration-emerald-500 decoration-wavy decoration-2">Cleaning</span> & Utility Payments
            </h1>

            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Book fully-serviced shortlet apartments with 24/7 power, schedule professional deep home cleaning, or buy electricity tokens, mobile data, airtime and cable TV instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/shortlets')}
                leftIcon={<Building2 className="w-5 h-5" />}
                className="shadow-lg shadow-emerald-600/30"
              >
                Browse Shortlets
              </Button>

              <Button
                variant="dark"
                size="lg"
                onClick={() => navigate('/utilities')}
                leftIcon={<Zap className="w-5 h-5 text-amber-400" />}
                className="group shadow-md font-semibold"
              >
                Pay Utility Bills
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Protected Payment system
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" /> Instant DisCo Token Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Vetted Background-Checked Cleaners
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                alt="Lofix Luxury Living"
                className="w-full h-80 sm:h-96 object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-400">Featured Shortlet</p>
                  <p className="text-sm font-extrabold">3-Bed Duplex Shortlet • Lekki Phase 1</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/shortlets')}
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="info" size="md">
            Our Core Services
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Select a Lofix Service
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Choose between shortlet property bookings, home cleaning services, or instant utility bill payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            className="group hover:shadow-2xl transition-all border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
                alt="Apartment Shortlets"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  Apartment Shortlets
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors font-display">
                Apartment Shortlets & Rentals
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse fully furnished whole apartments (flats & duplexes) and private rooms. Enjoy 24/7 electricity, smart TVs, equipped kitchens, and gated security.
              </p>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Verified listings in Lekki, Ikoyi & Abuja</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant Paystack online booking</span>
                </li>
              </ul>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold"
                onClick={() => navigate('/shortlets')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse Shortlets
              </Button>
            </div>
          </Card>

          <Card
            className="group hover:shadow-2xl transition-all border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                alt="Home Cleaning"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  Cleaning Services
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors font-display">
                Professional Home Cleaning
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use our dynamic price calculator to get an instant quote in NGN based on your exact rooms, bathrooms, floors, and add-ons.
              </p>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Dynamic room-based price calculator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Live step-by-step agent tracking bar</span>
                </li>
              </ul>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold"
                onClick={() => navigate('/cleaning')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Calculate & Book Clean
              </Button>
            </div>
          </Card>

          <Card
            className="group hover:shadow-2xl transition-all border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center p-6 text-white text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <h4 className="font-extrabold text-lg">Instant Utility Payments</h4>
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold">
                  Utility Bills
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors font-display">
                Electricity, Data, Airtime & Cable TV
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Purchase electricity tokens for IKEDC, EKEDC, AEDC, buy cheap data bundles (MTN, Airtel, Glo), top up airtime, and renew DSTV/GOTV subscriptions instantly.
              </p>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Meter & Smartcard number verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant Paystack NGN checkout</span>
                </li>
              </ul>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500"
                onClick={() => navigate('/utilities')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Pay Utility Bills
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* QUICK HOME SERVICES SECTION (STANDALONE DISHWASHING & LAUNDRY) */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="success" size="md">
              Express Home Chores
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Quick Standalone Home Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Need just a quick fix? Request standalone dishwashing or laundry wash-and-drop home service instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 space-y-4 border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Dishwashing-Only Home Service
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Have a pile of accumulated dishes and kitchenware? A professional cleaner will come directly to your home to wash, rinse, dry, and sanitize all kitchen utensils.
                </p>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-bold text-slate-700">Starting from</span>
                  <span className="font-black text-emerald-700 text-sm">₦3,500 / load</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold mt-4"
                onClick={() => setQuickServiceModal({ isOpen: true, type: 'dishwashing' })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Request Dishwashing Service
              </Button>
            </Card>

            <Card className="p-6 space-y-4 border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Shirt className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Quick Laundry Wash & Spin
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We wash and spin-dry your clothes at your home (no waiting for all-day sun drying; you pick, hang, and fold yourself).
                </p>
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-bold text-slate-700">Starting from</span>
                  <span className="font-black text-sky-700 text-sm">₦5,000 / basket</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold mt-4 bg-sky-600 hover:bg-sky-700 border-sky-600"
                onClick={() => setQuickServiceModal({ isOpen: true, type: 'laundry' })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Request Laundry Service
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="success" size="md">
              Why Lofix
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Built for Modern Nigerian Living
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Paystack Security</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Integrated with Paystack popup checkout for seamless, PCI-DSS compliant payment processing.
              </p>
            </div>

            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Live Job Tracking</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Watch field agent status transitions from assigned to en route, arrived, and completed in real time.
              </p>
            </div>

            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Instant Quotes</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                No hidden charges. Instant server calculation based on your property specifications and selected add-ons.
              </p>
            </div>

            <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h4 className="font-bold text-base text-white">Instant Tokens & Top-Up</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instant token delivery for electricity DisCos and real-time data/airtime recharges.
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuickServiceModal
        isOpen={quickServiceModal.isOpen}
        serviceType={quickServiceModal.type}
        onClose={() => setQuickServiceModal({ isOpen: false, type: 'dishwashing' })}
      />
    </CustomerLayout>
  );
};

export default LandingPage;
