import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentCleaningApi, AgentJob, AssignmentStatus } from '../../../api/agentCleaning';
import { formatDate } from '../../../utils/formatters';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { ToastContainer, ToastMessage } from '../../../components/common/Toast';
import { JobActionModal } from '../../../components/agent/JobActionModal';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Navigation,
  Play,
  Calendar,
  AlertCircle,
  Power,
} from 'lucide-react';

export const CleaningJobsTab: React.FC = () => {
  const [availabilityState, setAvailabilityState] = useState<'AVAILABLE' | 'OFFLINE'>('AVAILABLE');
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'completed'>('active');

  // Modal State for Action Transitions
  const [targetJob, setTargetAgentJob] = useState<AgentJob | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'accept' | 'reject' | 'en-route' | 'arrived' | 'start' | 'complete' | null
  >(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, isError, error } = useQuery({
    queryKey: ['agent-cleaning-jobs'],
    queryFn: () => agentCleaningApi.getAgentJobs(),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Availability Mutation
  const availabilityMutation = useMutation({
    mutationFn: (newStatus: 'AVAILABLE' | 'OFFLINE') =>
      agentCleaningApi.updateAvailability(newStatus),
    onSuccess: (_, newStatus) => {
      setAvailabilityState(newStatus);
      addToast('success', `Availability status updated to ${newStatus}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update availability. Make sure your cleaner profile is Admin-verified.';
      addToast('error', msg);
    },
  });

  // Action Transition Mutation
  const actionMutation = useMutation({
    mutationFn: async (payload: { latitude?: number; longitude?: number; message?: string }) => {
      if (!targetJob || !pendingAction) return;
      const bookingId = targetJob.cleaning_booking?.id || targetJob.bookingId || targetJob.id;

      switch (pendingAction) {
        case 'accept':
          return agentCleaningApi.acceptJob(bookingId, payload);
        case 'reject':
          return agentCleaningApi.rejectJob(bookingId, payload);
        case 'en-route':
          return agentCleaningApi.enRouteJob(bookingId, payload);
        case 'arrived':
          return agentCleaningApi.arrivedJob(bookingId, payload);
        case 'start':
          return agentCleaningApi.startJob(bookingId, payload);
        case 'complete':
          return agentCleaningApi.completeJob(bookingId, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-cleaning-jobs'] });
      addToast('success', `Job status updated: ${pendingAction?.toUpperCase()}`);
      setTargetAgentJob(null);
      setPendingAction(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to transition job state.';
      addToast('error', msg);
    },
  });

  const activeJobs = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'REJECTED' && j.status !== 'CANCELLED');
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
  const displayedJobs = activeSubTab === 'active' ? activeJobs : completedJobs;

  return (
    <div className="space-y-6">
      {/* Availability Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
              availabilityState === 'AVAILABLE'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Power className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Cleaner Availability Status</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Current State:{' '}
              <span
                className={`font-bold ${
                  availabilityState === 'AVAILABLE' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {availabilityState}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={availabilityState === 'AVAILABLE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => availabilityMutation.mutate('AVAILABLE')}
            isLoading={availabilityMutation.isPending && availabilityState === 'OFFLINE'}
            className={availabilityState === 'AVAILABLE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-white border-slate-700'}
          >
            Set AVAILABLE
          </Button>
          <Button
            variant={availabilityState === 'OFFLINE' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => availabilityMutation.mutate('OFFLINE')}
            isLoading={availabilityMutation.isPending && availabilityState === 'AVAILABLE'}
            className="text-white border-slate-700 hover:bg-slate-800"
          >
            Set OFFLINE
          </Button>
        </div>
      </div>

      {/* Error / Unverified Notice */}
      {isError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Cleaner Verification Required</p>
            <p className="mt-0.5 text-amber-800">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Your account must be enrolled and verified by an Admin in the Admin Console before receiving active cleaning assignments.'}
            </p>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeSubTab === 'active'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Jobs ({activeJobs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeSubTab === 'completed'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed Jobs ({completedJobs.length})
        </button>
      </div>

      {/* Job Cards List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedJobs.length === 0 ? (
        <Card className="text-center py-12 text-slate-400">
          <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No {activeSubTab} jobs assigned.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedJobs.map((job) => {
            const b = job.cleaning_booking;
            const prop = b?.propertySnapshot;

            return (
              <Card key={job.id} className="border border-slate-200 hover:border-purple-300 transition-all">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-purple-700">
                          {b?.reference || `Booking #${job.bookingId || job.id}`}
                        </span>
                        <Badge variant={job.status === 'COMPLETED' ? 'success' : 'info'}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Scheduled: <span className="font-semibold text-slate-800">{formatDate(b?.scheduledAt)}</span>
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Est. Duration: <strong>{b?.estimatedDurationMinutes || 60} mins</strong>
                    </div>
                  </div>

                  {/* Property & Note Snapshot */}
                  {prop && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" /> {prop.name}
                      </p>
                      <p className="text-slate-600">
                        {prop.addressLine1}, {prop.city}, {prop.state}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        Rooms: {prop.numberOfRooms} • Baths: {prop.numberOfBathrooms} • Floors: {prop.numberOfFloors}
                      </p>
                    </div>
                  )}

                  {b?.customerNote && (
                    <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded border border-amber-200 italic">
                      Customer Note: "{b.customerNote}"
                    </p>
                  )}

                  {/* Ordered Job Action Workflow Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {job.status === 'ASSIGNED' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setTargetAgentJob(job);
                            setPendingAction('accept');
                          }}
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Accept Job
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setTargetAgentJob(job);
                            setPendingAction('reject');
                          }}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {job.status === 'ACCEPTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTargetAgentJob(job);
                          setPendingAction('en-route');
                        }}
                        leftIcon={<Navigation className="w-4 h-4" />}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        En-Route
                      </Button>
                    )}

                    {job.status === 'EN_ROUTE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTargetAgentJob(job);
                          setPendingAction('arrived');
                        }}
                        leftIcon={<MapPin className="w-4 h-4" />}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Arrived
                      </Button>
                    )}

                    {job.status === 'ARRIVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTargetAgentJob(job);
                          setPendingAction('start');
                        }}
                        leftIcon={<Play className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Start Job
                      </Button>
                    )}

                    {job.status === 'STARTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTargetAgentJob(job);
                          setPendingAction('complete');
                        }}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Complete Job
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for Submitting Job Action */}
      {targetJob && pendingAction && (
        <JobActionModal
          isOpen={true}
          onClose={() => {
            setTargetAgentJob(null);
            setPendingAction(null);
          }}
          title={`Confirm Job Action: ${pendingAction.toUpperCase()}`}
          actionName={pendingAction.toUpperCase()}
          onConfirm={(payload) => actionMutation.mutate(payload)}
          isLoading={actionMutation.isPending}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
};
