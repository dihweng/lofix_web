import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { CleaningBooking, BookingStatus } from '../../api/bookings';
import { formatDate, formatStatus } from '../../utils/formatters';
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface LiveJobTrackingModalProps {
  isOpen: boolean;
  booking: CleaningBooking | null;
  onClose: () => void;
}

export const LiveJobTrackingModal: React.FC<LiveJobTrackingModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  const bookingId = booking?.id || 0;

  const {
    data: trackingEvents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['jobTracking', bookingId],
    queryFn: () => cleaningCustomerApi.getJobTracking(bookingId),
    enabled: isOpen && !!bookingId,
    refetchInterval: isOpen ? 10000 : false,
  });

  if (!booking) return null;

  const stages: Array<{ key: string; label: string; description: string }> = [
    { key: 'CONFIRMED', label: 'Order Placed', description: 'Booking confirmed & scheduled' },
    { key: 'CLEANER_ASSIGNED', label: 'Agent Assigned', description: 'Cleaner matched to property' },
    { key: 'CLEANER_EN_ROUTE', label: 'En Route', description: 'Cleaner traveling to address' },
    { key: 'CLEANER_ARRIVED', label: 'Arrived', description: 'Cleaner at property' },
    { key: 'IN_PROGRESS', label: 'In Progress', description: 'Deep cleaning underway' },
    { key: 'COMPLETED', label: 'Completed', description: 'Job finished & verified' },
  ];

  const getStageIndex = (status: BookingStatus) => {
    switch (status) {
      case 'PAYMENT_PENDING':
      case 'CONFIRMED':
        return 0;
      case 'CLEANER_ASSIGNED':
        return 1;
      case 'CLEANER_EN_ROUTE':
        return 2;
      case 'CLEANER_ARRIVED':
        return 3;
      case 'IN_PROGRESS':
        return 4;
      case 'COMPLETED':
        return 5;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(booking.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Cleaning Job Tracker #${booking.reference || booking.id}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 text-white rounded-2xl gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                {booking.priceSnapshot?.serviceName || 'Home Cleaning'}
              </span>
              <Badge variant={booking.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
                {formatStatus(booking.status)}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{booking.propertySnapshot?.addressLine1}, {booking.propertySnapshot?.city}</span>
            </p>
          </div>

          <Button
            variant="dark"
            size="sm"
            onClick={() => refetch()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Status
          </Button>
        </div>

        {booking.status === 'CANCELLED' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold">This booking was cancelled.</p>
              {booking.cancellationReason && (
                <p className="text-[11px] text-red-700">Reason: {booking.cancellationReason}</p>
              )}
            </div>
          </div>
        )}

        {booking.status !== 'CANCELLED' && (
          <div className="py-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{
                    width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {stages.map((stage, idx) => {
                const isDone = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      } ${isCurrent ? 'scale-110' : ''}`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-2 text-center max-w-[60px] ${
                        isCurrent
                          ? 'text-emerald-700'
                          : isDone
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" /> Real-time Activity Log
          </h4>

          {trackingEvents.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              Scheduled for {formatDate(booking.scheduledAt)}. Activity logs will appear once cleaner updates status.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {trackingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between text-xs p-2 bg-white rounded-lg border border-slate-200"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">{formatStatus(evt.status)}</span>
                    {evt.message && <p className="text-slate-600 text-[11px]">{evt.message}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatDate(evt.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
