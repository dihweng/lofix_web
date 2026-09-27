import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { CleaningJobsTab } from './tabs/CleaningJobsTab';
import { RentalListingsTab } from './tabs/RentalListingsTab';
import { ProfileEarningsTab } from './tabs/ProfileEarningsTab';
import { Wrench, Home, UserCheck } from 'lucide-react';

export const AgentDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname.includes('/agent/rentals')) return 'rentals';
    if (location.pathname.includes('/agent/profile')) return 'profile';
    return 'cleaning';
  };

  const activeTab = getActiveTab();

  return (
    <PageLayout
      title="Agent Workstation"
      subtitle="Manage cleaning field jobs, shortlet listings, tenant bookings & performance"
    >
      <div className="space-y-6">
        {/* Main Workstation Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => navigate('/agent/cleaning')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'cleaning'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Cleaning Field Jobs</span>
          </button>

          <button
            onClick={() => navigate('/agent/rentals')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'rentals'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Rental Listings & Shortlets</span>
          </button>

          <button
            onClick={() => navigate('/agent/profile')}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profile & Earnings</span>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'cleaning' && <CleaningJobsTab />}
          {activeTab === 'rentals' && <RentalListingsTab />}
          {activeTab === 'profile' && <ProfileEarningsTab />}
        </div>
      </div>
    </PageLayout>
  );
};
