import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FolderTree,
  Home,
  Layers,
  Wrench,
  Tag,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  Building,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/', icon: <Home className="w-4 h-4" /> }],
  },
  {
    title: 'House & Shortlets',
    items: [
      { label: 'Apartments', path: '/apartments', icon: <Home className="w-4 h-4" /> },
      { label: 'Rooms', path: '/rooms', icon: <Building className="w-4 h-4" /> },
      { label: 'Shortlet Bookings', path: '/shortlet-bookings', icon: <Calendar className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Cleaning Config',
    items: [
      { label: 'Categories', path: '/categories', icon: <FolderTree className="w-4 h-4" /> },
      { label: 'Property Types', path: '/property-types', icon: <Layers className="w-4 h-4" /> },
      { label: 'Services', path: '/services', icon: <Wrench className="w-4 h-4" /> },
      { label: 'Add-ons', path: '/addons', icon: <Tag className="w-4 h-4" /> },
      { label: 'Pricing Rules', path: '/pricing-rules', icon: <DollarSign className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Agent Directory', path: '/agents', icon: <Users className="w-4 h-4" /> },
      { label: 'Cleaning Bookings', path: '/bookings', icon: <Calendar className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Transactions', path: '/transactions', icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">LOFIX</h1>
          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
            Admin Console
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Module Info Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <p className="font-semibold text-slate-200">Lofix Admin Platform</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Shortlets • Cleaning • Finance</p>
        </div>
      </div>
    </aside>
  );
};
