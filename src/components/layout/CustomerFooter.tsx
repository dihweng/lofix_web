import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">Lofix</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Premium shortlets, on-demand home cleaning, and instant utility bill payments across Nigeria. Luxury living made effortless.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Services & Paystack Security</span>
            </div>
          </div>

          {/* Shortlets links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-4">Apartments & Shortlets</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/shortlets" className="hover:text-emerald-400 transition-colors">Luxury Apartments</Link>
              </li>
              <li>
                <Link to="/shortlets" className="hover:text-emerald-400 transition-colors">Single Room Rentals</Link>
              </li>
              <li>
                <Link to="/shortlets" className="hover:text-emerald-400 transition-colors">Duplex Shortlets</Link>
              </li>
              <li>
                <Link to="/shortlets" className="hover:text-emerald-400 transition-colors">For Rent & For Sale</Link>
              </li>
            </ul>
          </div>

          {/* Home Cleaning & Utilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-4">Cleaning & Utilities</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/cleaning" className="hover:text-emerald-400 transition-colors">Home Cleaning Calculator</Link>
              </li>
              <li>
                <Link to="/utilities" className="hover:text-emerald-400 transition-colors">Buy Electricity Tokens</Link>
              </li>
              <li>
                <Link to="/utilities" className="hover:text-emerald-400 transition-colors">Buy Data & Airtime</Link>
              </li>
              <li>
                <Link to="/utilities" className="hover:text-emerald-400 transition-colors">Renew Cable TV Subscriptions</Link>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-4">Support & Contact</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Lagos & Abuja, Nigeria</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>+234 (0) 800 563 4900</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>support@lofix.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Lofix Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for seamless living.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
