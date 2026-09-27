import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wrench, Home, UserCheck, Sparkles } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const agentNavItems: NavItem[] = [
  { label: 'Cleaning Jobs', path: '/agent/cleaning', icon: <Wrench className="w-4 h-4" /> },
  { label: 'Rental Listings', path: '/agent/rentals', icon: <Home className="w-4 h-4" /> },
  { label: 'Profile & Earnings', path: '/agent/profile', icon: <UserCheck className="w-4 h-4" /> },
];

export const AgentSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">LOFIX</h1>
          <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
            Agent Portal
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        <h2 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Agent Workspaces
        </h2>
        <div className="space-y-1">
          {agentNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
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

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <p className="font-semibold text-slate-200">Field Operations</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Connected as Agent</p>
        </div>
      </div>
    </aside>
  );
};
