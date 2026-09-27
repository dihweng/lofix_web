import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatNaira } from '../utils/money';
import { transactionsApi } from '../api/transactions';
import { shortletBookingsApi } from '../api/shortletBookings';
import { bookingsApi } from '../api/bookings';
import { agentsApi } from '../api/agents';
import {
  FolderTree,
  Layers,
  Wrench,
  Tag,
  DollarSign,
  Users,
  Calendar,
  Home,
  Building,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export const DashboardOverviewPage: React.FC = () => {
  // Metric Queries
  const { data: transactions = [] } = useQuery({
    queryKey: ['admin-overview-transactions'],
    queryFn: () => transactionsApi.getAdminTransactions(),
  });

  const { data: shortletBookings = [] } = useQuery({
    queryKey: ['admin-overview-shortlets'],
    queryFn: () => shortletBookingsApi.getShortletBookings(),
  });

  const { data: cleaningBookings = [] } = useQuery({
    queryKey: ['admin-overview-cleaning'],
    queryFn: () => bookingsApi.getAdminBookings(undefined, 100, 0),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin-overview-agents'],
    queryFn: () => agentsApi.getAgents(100, 0),
  });

  // Calculate Key Metrics
  const totalRevenueKobo = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const activeAgentsCount = agents.filter(
    (a) => a.verified && a.status === 'AVAILABLE'
  ).length;

  const quickLinks = [
    { title: 'Apartment Shortlets', path: '/apartments', icon: <Home className="w-5 h-5 text-emerald-600" />, desc: 'Manage shortlet apartment listings, coordinates & pricing' },
    { title: 'Rooms', path: '/rooms', icon: <Building className="w-5 h-5 text-blue-600" />, desc: 'Configure room types, amenities and parent apartments' },
    { title: 'Shortlet Bookings', path: '/shortlet-bookings', icon: <Calendar className="w-5 h-5 text-purple-600" />, desc: 'View accommodation bookings, payments & process refunds' },
    { title: 'Transactions & Payments', path: '/transactions', icon: <CreditCard className="w-5 h-5 text-indigo-600" />, desc: 'View system payment logs, verification status & receipts' },
    { title: 'Cleaning Categories', path: '/categories', icon: <FolderTree className="w-5 h-5 text-emerald-700" />, desc: 'Configure cleaning service categories' },
    { title: 'Cleaning Services', path: '/services', icon: <Wrench className="w-5 h-5 text-amber-600" />, desc: 'Set up catalog cleaning services and durations' },
    { title: 'Pricing Rules', path: '/pricing-rules', icon: <DollarSign className="w-5 h-5 text-emerald-700" />, desc: 'Set base, room, bathroom, floor & service fee rates' },
    { title: 'Cleaning Agents', path: '/agents', icon: <Users className="w-5 h-5 text-purple-600" />, desc: 'Enroll Agent accounts, verify & manage availability' },
    { title: 'Cleaning Bookings', path: '/bookings', icon: <Calendar className="w-5 h-5 text-sky-600" />, desc: 'Inspect cleaning bookings, assign agents & cancel' },
  ];

  return (
    <PageLayout
      title="Admin Dashboard"
      subtitle="Platform Overview — Shortlets, Cleaning, Transactions & Revenue"
    >
      <div className="space-y-6">
        {/* System Status Callout */}
        <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Lofix Admin Gateway Active</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Connected to backend API. All operations respect integer kobo pricing rules and explicit role permissions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/transactions">
              <Button variant="outline" size="sm" className="text-white border-slate-700 hover:bg-slate-800">
                Transactions
              </Button>
            </Link>
            <Link to="/shortlet-bookings">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Shortlet Bookings
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Revenue</p>
                <p className="text-xl font-extrabold text-emerald-950 font-mono mt-1">
                  {formatNaira(totalRevenueKobo)}
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">From completed transactions</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Shortlet Bookings</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {shortletBookings.length}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Accommodation shortlets</p>
              </div>
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                <Home className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cleaning Bookings</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {cleaningBookings.length}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Home cleaning jobs</p>
              </div>
              <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Cleaners</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {activeAgentsCount} / {agents.length}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Verified & Available</p>
              </div>
              <div className="p-3 bg-amber-600 text-white rounded-xl shadow-sm">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Navigation Cards */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Platform Modules Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Card className="hover:border-emerald-300 hover:shadow-md transition-all h-full group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {link.title}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{link.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Manual Refund Required Policy Notice */}
        <Card title="Refund Handling Policy Notice" className="bg-amber-50/50 border-amber-200">
          <div className="flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Manual Paystack Refund Reconciliation</p>
              <p className="text-amber-800">
                Paid cleaning cancellations set <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">refundRequired=true</code>.
                Shortlet bookings can be cancelled and refunded via <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">POST /bookings/refund/:id</code>.
                Always verify payment references in the Paystack test/live dashboard.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
