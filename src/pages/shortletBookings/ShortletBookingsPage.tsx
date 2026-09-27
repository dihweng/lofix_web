import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shortletBookingsApi, ShortletBooking, ShortletBookingStatus } from '../../api/shortletBookings';
import { formatNaira } from '../../utils/money';
import { formatDate } from '../../utils/formatters';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Calendar, Eye, RefreshCw, AlertTriangle, User, Home } from 'lucide-react';

export const ShortletBookingsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ShortletBookingStatus | ''>('');
  const [selectedBooking, setSelectedBooking] = useState<ShortletBooking | null>(null);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-shortlet-bookings'],
    queryFn: () => shortletBookingsApi.getShortletBookings(),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const filteredBookings = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) return;
      if (!refundReason.trim()) throw new Error('Refund reason is required');
      return shortletBookingsApi.refundShortletBooking(selectedBooking.id, {
        reason: refundReason.trim(),
        category: 'DEFAULT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shortlet-bookings'] });
      addToast('success', 'Booking cancelled and refund recorded successfully');
      setIsRefundModalOpen(false);
      setSelectedBooking(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to process refund';
      addToast('error', msg);
    },
  });

  const columns: Column<ShortletBooking>[] = [
    {
      header: 'Booking ID',
      cell: (b) => (
        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
          #{b.id}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (b) => (
        <div>
          <div className="font-semibold text-slate-900">
            {b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : `Customer #${b.customerId}`}
          </div>
          <div className="text-xs text-slate-500 font-mono">{b.customer?.email || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Property / Room',
      cell: (b) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">
            {b.apartment ? b.apartment.title : `Apartment #${b.apartmentId}`}
          </div>
          {b.room && <div className="text-slate-500">Room: {b.room.title}</div>}
        </div>
      ),
    },
    {
      header: 'Stay Period',
      cell: (b) => (
        <div className="text-xs font-medium text-slate-700">
          <div>{formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
          <div className="text-slate-500 font-mono">({b.days} days)</div>
        </div>
      ),
    },
    {
      header: 'Total Cost',
      cell: (b) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(b.totalCost)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (b) => {
        const variants = {
          PENDING: 'warning' as const,
          OPEN: 'success' as const,
          CANCELLED: 'danger' as const,
        };
        return <Badge variant={variants[b.status]}>{b.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (b) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedBooking(b)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View / Refund
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Shortlet Accommodation Bookings"
      subtitle="Inspect shortlet bookings, customer payments & handle cancellation refunds"
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="w-full sm:w-64">
            <Select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShortletBookingStatus | '')}
              options={[
                { value: 'PENDING', label: 'PENDING (Awaiting payment)' },
                { value: 'OPEN', label: 'OPEN (Active paid booking)' },
                { value: 'CANCELLED', label: 'CANCELLED' },
              ]}
              placeholder="All Booking Statuses"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredBookings.length}</strong> shortlet bookings
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredBookings}
          isLoading={isLoading}
          keyExtractor={(b) => b.id}
          emptyMessage="No shortlet accommodation bookings found."
        />
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && !isRefundModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBooking(null)}
          title={`Shortlet Booking #${selectedBooking.id}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Header Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <p className="font-mono text-emerald-400 font-bold">Booking #{selectedBooking.id}</p>
                <p className="text-slate-300 mt-0.5">
                  Stay Period: {formatDate(selectedBooking.startDate)} to {formatDate(selectedBooking.endDate)} ({selectedBooking.days} days)
                </p>
              </div>
              <Badge variant={selectedBooking.status === 'OPEN' ? 'success' : selectedBooking.status === 'CANCELLED' ? 'danger' : 'warning'}>
                {selectedBooking.status}
              </Badge>
            </div>

            {/* Customer & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Customer:
                </p>
                <p className="font-medium text-slate-800 mt-1">
                  {selectedBooking.customer ? `${selectedBooking.customer.firstName} ${selectedBooking.customer.lastName}` : `ID #${selectedBooking.customerId}`}
                </p>
                <p className="text-slate-500">{selectedBooking.customer?.email}</p>
                <p className="text-slate-500">{selectedBooking.customer?.phoneNumber}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-blue-600" /> Property:
                </p>
                <p className="font-medium text-slate-800 mt-1">
                  {selectedBooking.apartment?.title || `Apartment #${selectedBooking.apartmentId}`}
                </p>
                {selectedBooking.room && <p className="text-slate-500">Room: {selectedBooking.room.title}</p>}
                <p className="font-mono text-emerald-700 font-bold mt-1">Total: {formatNaira(selectedBooking.totalCost)}</p>
              </div>
            </div>

            {/* Payments List */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Payment History ({selectedBooking.payments?.length || 0})</p>
              {!selectedBooking.payments || selectedBooking.payments.length === 0 ? (
                <p className="text-slate-500 italic">No payments recorded for this booking.</p>
              ) : (
                <div className="space-y-1">
                  {selectedBooking.payments.map((p) => (
                    <div key={p.id} className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between font-mono">
                      <div>
                        <span>Payment #{p.id} — Gateway: {p.gateway}</span>
                        <div className="text-[10px] text-slate-400">{formatDate(p.createdAt)}</div>
                      </div>
                      <Badge variant={p.status === 'PAID' ? 'success' : 'danger'}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setRefundReason('');
                  setIsRefundModalOpen(true);
                }}
                disabled={selectedBooking.status !== 'OPEN'}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Cancel & Refund Booking
              </Button>

              <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel & Refund Modal */}
      {selectedBooking && isRefundModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRefundModalOpen(false)}
          title={`Refund Shortlet Booking #${selectedBooking.id}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              refundMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs space-y-1">
              <p className="font-bold">Process Admin Cancellation & Refund</p>
              <p>
                This will cancel open Shortlet Booking #{selectedBooking.id} and register an official refund record.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reason for Cancellation / Refund <span className="text-red-500">*</span>
              </label>
              <textarea
                className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Specify reason for refund..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>
                Back
              </Button>
              <Button type="submit" variant="danger" isLoading={refundMutation.isPending}>
                Confirm Cancel & Refund
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
