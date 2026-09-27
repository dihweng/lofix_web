import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { CleaningBooking } from '../../api/bookings';
import { Calendar, XCircle, AlertCircle } from 'lucide-react';

interface RescheduleCancelModalProps {
  isOpen: boolean;
  booking: CleaningBooking | null;
  mode: 'reschedule' | 'cancel';
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleCancelModal: React.FC<RescheduleCancelModalProps> = ({
  isOpen,
  booking,
  mode,
  onClose,
  onSuccess,
}) => {
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    if (booking?.scheduledAt) {
      return new Date(booking.scheduledAt).toISOString().slice(0, 16);
    }
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 16);
  });

  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);

    try {
      if (mode === 'reschedule') {
        if (!scheduledAt) {
          setErrorMsg('Please select a new date and time.');
          setIsLoading(false);
          return;
        }
        await cleaningCustomerApi.rescheduleBooking(booking.id, scheduledAt);
      } else {
        if (!reason.trim()) {
          setErrorMsg('Please state a reason for cancellation.');
          setIsLoading(false);
          return;
        }
        await cleaningCustomerApi.cancelBooking(booking.id, reason.trim());
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || `Failed to ${mode} booking.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'reschedule'
          ? `Reschedule Cleaning Booking #${booking.reference || booking.id}`
          : `Cancel Cleaning Booking #${booking.reference || booking.id}`
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'reschedule' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Select a new preferred date and time for your cleaning service. Rescheduling is free before cleaner travel.
            </p>
            <Input
              label="New Scheduled Date & Time"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <p className="font-bold">Cancellation Policy</p>
              <p className="text-[11px] mt-0.5">
                Bookings can be cancelled free of charge prior to cleaner departure.
              </p>
            </div>
            <Input
              label="Cancellation Reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Change of plans / Travelling..."
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            type="submit"
            variant={mode === 'reschedule' ? 'primary' : 'danger'}
            size="md"
            isLoading={isLoading}
            leftIcon={
              mode === 'reschedule' ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )
            }
          >
            {mode === 'reschedule' ? 'Confirm Reschedule' : 'Cancel Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
