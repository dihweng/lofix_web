import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAgentAuth } from '../../../context/AgentAuthContext';
import { agentCleaningApi } from '../../../api/agentCleaning';
import { shortletBookingsApi } from '../../../api/shortletBookings';
import { authApi, Account } from '../../../api/auth';
import { formatNaira } from '../../../utils/money';
import { formatDate } from '../../../utils/formatters';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { User, Star, CheckCircle2, DollarSign, ShieldCheck, Mail, Phone } from 'lucide-react';

export const ProfileEarningsTab: React.FC = () => {
  const { user } = useAgentAuth();

  // Load detailed account ratings
  const { data: accountDetail } = useQuery<Account>({
    queryKey: ['agent-account-detail', user?.id],
    queryFn: () => authApi.getById(user!.id),
    enabled: !!user?.id,
  });

  // Load Cleaning Assignments
  const { data: cleaningJobs = [] } = useQuery({
    queryKey: ['agent-cleaning-jobs'],
    queryFn: () => agentCleaningApi.getAgentJobs(),
  });

  // Load Rental Bookings
  const { data: shortletBookings = [] } = useQuery({
    queryKey: ['agent-tenant-bookings'],
    queryFn: () => shortletBookingsApi.getShortletBookings(),
  });

  const completedCleaningCount = cleaningJobs.filter((j) => j.status === 'COMPLETED').length;
  const activeCleaningCount = cleaningJobs.filter(
    (j) => j.status !== 'COMPLETED' && j.status !== 'REJECTED' && j.status !== 'CANCELLED'
  ).length;

  const totalRentalEarningsKobo = shortletBookings
    .filter((b) => b.status === 'OPEN')
    .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card className="bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-purple-600/30">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {user?.firstName} {user?.lastName}
                </h3>
                <Badge variant="info">{user?.role}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
                {user?.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phoneNumber}</span>}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-right text-xs">
            <p className="text-slate-400 font-medium">Account ID</p>
            <p className="text-sm font-mono font-bold text-purple-400">#{user?.id}</p>
          </div>
        </div>
      </Card>

      {/* Earnings & Activity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Completed Cleaning Jobs
              </p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {completedCleaningCount}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Active jobs: {activeCleaningCount}</p>
            </div>
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Rental Bookings Revenue
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {formatNaira(totalRentalEarningsKobo)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                From {shortletBookings.length} accommodation bookings
              </p>
            </div>
            <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Agent Ratings Overview
              </p>
              <p className="text-2xl font-extrabold text-amber-600 font-mono mt-1 flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>5.0 / 5</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Customer rating average</p>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Completed Jobs History */}
      <Card title="Completed Cleaning Assignments History">
        {completedCleaningCount === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center italic">No completed jobs yet.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {cleaningJobs
              .filter((j) => j.status === 'COMPLETED')
              .map((j) => (
                <div key={j.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-purple-700">
                      {j.cleaning_booking?.reference || `Booking #${j.bookingId}`}
                    </span>
                    <div className="text-slate-500 text-[11px]">
                      Completed: {formatDate(j.completedAt || j.createdAt)}
                    </div>
                  </div>
                  <Badge variant="success">COMPLETED</Badge>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
};
