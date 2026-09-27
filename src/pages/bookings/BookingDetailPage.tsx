import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookingsApi,
  CleaningBooking,
  TrackingEvent,
  BookingReview,
} from '../../api/bookings';
import { agentsApi, CleaningAgent } from '../../api/agents';
import { authApi } from '../../api/auth';
import { formatNaira } from '../../utils/money';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  XCircle,
  MapPin,
  Star,
  Activity,
  DollarSign,
  Home,
} from 'lucide-react';

export interface BookingDetailPageProps {
  bookingId: number;
  onClose: () => void;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export const BookingDetailPage: React.FC<BookingDetailPageProps> = ({
  bookingId,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tracking' | 'review'>('details');

  // Modals inside drawer
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAgentProfileId, setSelectedAgentProfileId] = useState<number | ''>('');

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newScheduledAt, setNewScheduledAt] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const queryClient = useQueryClient();

  // Load Booking Detail
  const { data: booking, isLoading } = useQuery<CleaningBooking>({
    queryKey: ['admin-booking-detail', bookingId],
    queryFn: () => bookingsApi.getBookingDetail(bookingId),
  });

  // Load Agents for Assignment selection
  const { data: agents = [] } = useQuery<CleaningAgent[]>({
    queryKey: ['admin-agents-assignment'],
    queryFn: () => agentsApi.getAgents(100, 0),
    enabled: isAssignModalOpen,
  });

  // Load Accounts for displaying agent names
  const { data: accounts = [] } = useQuery({
    queryKey: ['admin-accounts-all'],
    queryFn: () => authApi.getAccounts(),
    enabled: isAssignModalOpen,
  });

  // Filter available and verified agent profiles
  const availableVerifiedAgents = agents.filter(
    (a) => a.verified && a.status === 'AVAILABLE'
  );

  // Load Tracking History
  const { data: trackingEvents = [] } = useQuery<TrackingEvent[]>({
    queryKey: ['admin-booking-tracking', bookingId],
    queryFn: () => bookingsApi.getTrackingHistory(bookingId),
    enabled: activeTab === 'tracking',
  });

  // Load Review
  const { data: review } = useQuery<BookingReview | null>({
    queryKey: ['admin-booking-review', bookingId],
    queryFn: () => bookingsApi.getBookingReview(bookingId),
    enabled: activeTab === 'review',
  });

  // Assign Agent Mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgentProfileId) throw new Error('Select an available cleaner profile');
      return bookingsApi.assignAgent(bookingId, Number(selectedAgentProfileId));
    },
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-detail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      onToast('success', `Assigned Agent Profile #${assignment.agentId} to booking`);
      setIsAssignModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to assign agent';
      onToast('error', msg);
    },
  });

  // Reschedule Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!newScheduledAt) throw new Error('Select new scheduled date and time');
      return bookingsApi.rescheduleBooking(
        bookingId,
        new Date(newScheduledAt).toISOString()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-detail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      onToast('success', 'Booking rescheduled successfully');
      setIsRescheduleModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reschedule booking';
      onToast('error', msg);
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancellationReason.trim()) throw new Error('Cancellation reason is required');
      return bookingsApi.cancelBooking(bookingId, cancellationReason.trim());
    },
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-detail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      onToast(
        'success',
        `Booking cancelled. ${updatedBooking.refundRequired ? 'Flagged for manual refund (refundRequired=true).' : ''}`
      );
      setIsCancelModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to cancel booking';
      onToast('error', msg);
    },
  });

  if (isLoading || !booking) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading Booking Details..." maxWidth="xl">
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

  const prop = booking.propertySnapshot;
  const price = booking.priceSnapshot;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Booking ${booking.reference}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-emerald-400">
                {booking.reference}
              </span>
              <Badge variant={booking.status === 'COMPLETED' ? 'success' : booking.status === 'CANCELLED' ? 'danger' : 'info'}>
                {booking.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Scheduled:{' '}
              <span className="font-semibold text-white">{formatDate(booking.scheduledAt)}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Price</p>
            <p className="text-lg font-mono font-bold text-emerald-400">{formatNaira(booking.total)}</p>
          </div>
        </div>

        {/* Refund Required Flag Warning */}
        {booking.refundRequired && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Manual Refund Required (refundRequired = true)</p>
              <p className="mt-0.5 text-red-800">
                This paid booking was cancelled. Operators must manually issue a refund on Paystack test/live dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-200 pb-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedAgentProfileId(
                availableVerifiedAgents.length > 0 ? availableVerifiedAgents[0].id : ''
              );
              setIsAssignModalOpen(true);
            }}
            disabled={!['CONFIRMED', 'CLEANER_ASSIGNED'].includes(booking.status)}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Assign Agent
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewScheduledAt(
                new Date(booking.scheduledAt).toISOString().slice(0, 16)
              );
              setIsRescheduleModalOpen(true);
            }}
            disabled={!['PAYMENT_PENDING', 'CONFIRMED'].includes(booking.status)}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Reschedule
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setCancellationReason('');
              setIsCancelModalOpen(true);
            }}
            disabled={
              !['PAYMENT_PENDING', 'CONFIRMED', 'CLEANER_ASSIGNED'].includes(
                booking.status
              )
            }
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Cancel Booking
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Snapshots & Assignments
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'tracking'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Tracking History
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" /> Customer Review
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Property Snapshot */}
            {prop && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Property Snapshot: {prop.name}</span>
                </div>
                <p className="text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {prop.addressLine1}{prop.addressLine2 ? `, ${prop.addressLine2}` : ''}, {prop.city}, {prop.state}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 font-mono">
                  <div>Rooms: <span className="font-bold text-slate-900">{prop.numberOfRooms}</span></div>
                  <div>Baths: <span className="font-bold text-slate-900">{prop.numberOfBathrooms}</span></div>
                  <div>Floors: <span className="font-bold text-slate-900">{prop.numberOfFloors}</span></div>
                  <div>Sq.M: <span className="font-bold text-slate-900">{prop.squareMeters}</span></div>
                </div>
                {prop.accessInstructions && (
                  <p className="text-slate-500 bg-white p-2 rounded border border-slate-200">
                    Access Note: {prop.accessInstructions}
                  </p>
                )}
              </div>
            )}

            {/* Price Snapshot */}
            {price && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Price Snapshot ({price.serviceName})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div>Base Price: {formatNaira(price.basePrice)}</div>
                  <div>Room Charges: {formatNaira(price.roomCharges)}</div>
                  <div>Bath Charges: {formatNaira(price.bathroomCharges)}</div>
                  <div>Floor Charges: {formatNaira(price.floorCharges)}</div>
                  <div>Service Fee: {formatNaira(price.serviceFee)}</div>
                  <div>Addons Total: {formatNaira(price.addonsTotal)}</div>
                </div>
                {price.addons && price.addons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <p className="font-semibold text-slate-800">Add-ons Breakdown:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600">
                      {price.addons.map((a, i) => (
                        <li key={i}>
                          Addon #{a.addonId} (Qty: {a.quantity}) — {formatNaira(a.price)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Assignments List */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Assigned Agents ({booking.assignments?.length || 0})
              </h4>

              {!booking.assignments || booking.assignments.length === 0 ? (
                <p className="text-slate-500 italic">No cleaning agent currently assigned.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {booking.assignments.map((asgn) => (
                    <div
                      key={asgn.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          Agent Profile ID: <span className="font-mono text-emerald-700">#{asgn.agentId}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Assignment ID: #{asgn.id}
                        </p>
                      </div>
                      <Badge variant={asgn.status === 'COMPLETED' ? 'success' : asgn.status === 'REJECTED' || asgn.status === 'CANCELLED' ? 'danger' : 'info'}>
                        {asgn.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {booking.cancellationReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                <p className="font-bold">Cancellation Reason:</p>
                <p className="mt-0.5">{booking.cancellationReason}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRACKING HISTORY */}
        {activeTab === 'tracking' && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {trackingEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No tracking events recorded.</p>
            ) : (
              trackingEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{evt.message || 'Tracking Event'}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(evt.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
                    <span>Status: <strong className="text-emerald-700">{evt.status}</strong></span>
                    <span>Actor ID: #{evt.actorId}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER REVIEW */}
        {activeTab === 'review' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            {!review ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No review submitted by customer.</p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-amber-600 text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{review.rating} / 5 Rating</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{formatDate(review.createdAt)}</span>
                </div>
                {review.comment && (
                  <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 italic">
                    "{review.comment}"
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-200/60">
                  <div>Cleanliness: {review.cleanlinessRating || '—'} / 5</div>
                  <div>Punctuality: {review.punctualityRating || '—'} / 5</div>
                  <div>Professionalism: {review.professionalismRating || '—'} / 5</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Cleaner to Booking"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignMutation.mutate();
          }}
          className="space-y-4"
        >
          {availableVerifiedAgents.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
              No verified agents with "AVAILABLE" status currently exist.
            </div>
          ) : (
            <Select
              label="Select Verified Available Cleaner"
              value={selectedAgentProfileId}
              onChange={(e) => setSelectedAgentProfileId(Number(e.target.value))}
              options={availableVerifiedAgents.map((ag) => {
                const acc = accounts.find((a) => a.id === ag.accountId);
                return {
                  value: ag.id,
                  label: `Profile #${ag.id} (Account #${ag.accountId} — ${acc ? `${acc.firstName} ${acc.lastName}` : 'Agent'})`,
                };
              })}
              placeholder="Choose cleaner profile..."
              required
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={availableVerifiedAgents.length === 0 || !selectedAgentProfileId}
              isLoading={assignMutation.isPending}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Booking"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            rescheduleMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="New Scheduled Date & Time"
            type="datetime-local"
            value={newScheduledAt}
            onChange={(e) => setNewScheduledAt(e.target.value)}
            required
            helperText="Rescheduling is permitted only before an agent is assigned."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={rescheduleMutation.isPending}
            >
              Update Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Booking Cancellation"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cancelMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs space-y-1">
            <p className="font-bold">Caution: Cancelling Booking {booking.reference}</p>
            <p>
              Paid cancellations will mark <code className="bg-red-100 px-1 rounded font-bold">refundRequired = true</code> and require manual refund handling on Paystack.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="State the reason for cancelling this booking..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Abort
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={cancelMutation.isPending}
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
};
