import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, CleaningBooking, BookingStatus } from '../../api/bookings';
import { formatNaira } from '../../utils/money';
import { formatDate } from '../../utils/formatters';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { BookingDetailPage } from './BookingDetailPage';
import { AlertTriangle, Eye, Calendar } from 'lucide-react';

export const BookingsPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<BookingStatus | ''>('');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', selectedStatusFilter, limit, offset],
    queryFn: () =>
      bookingsApi.getAdminBookings(
        selectedStatusFilter ? (selectedStatusFilter as BookingStatus) : undefined,
        limit,
        offset
      ),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Count refundRequired on loaded page
  const pageRefundCount = bookings.filter((b) => b.refundRequired).length;

  const columns: Column<CleaningBooking>[] = [
    {
      header: 'Reference',
      cell: (b) => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs">{b.reference}</div>
          <div className="text-[11px] text-slate-500 font-mono">ID: #{b.id}</div>
        </div>
      ),
    },
    {
      header: 'Scheduled Date',
      cell: (b) => (
        <div className="text-xs text-slate-800 font-medium">
          {formatDate(b.scheduledAt)}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (b) => {
        const variants: Record<BookingStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          PAYMENT_PENDING: 'warning',
          CONFIRMED: 'info',
          CLEANER_ASSIGNED: 'info',
          CLEANER_EN_ROUTE: 'info',
          CLEANER_ARRIVED: 'info',
          IN_PROGRESS: 'info',
          COMPLETED: 'success',
          CANCELLED: 'danger',
        };
        return (
          <div className="space-y-1">
            <Badge variant={variants[b.status]}>{b.status}</Badge>
            {b.refundRequired && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                <AlertTriangle className="w-3 h-3 text-red-600" /> Refund Required
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Total Price',
      cell: (b) => (
        <div className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(b.total)}
        </div>
      ),
    },
    {
      header: 'Property Address',
      cell: (b) => (
        <div className="text-xs text-slate-600 max-w-xs truncate">
          {b.propertySnapshot
            ? `${b.propertySnapshot.addressLine1}, ${b.propertySnapshot.city}`
            : '—'}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (b) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedBookingId(b.id)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View / Manage
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Booking Management"
      subtitle="Inspect customer cleaning bookings, assign agents, reschedule and manage cancellations"
    >
      <div className="space-y-4">
        {/* Refund Flag Callout Box */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Refund Handling Policy (<span className="font-bold">{pageRefundCount}</span> on current page requiring manual refund)
              </p>
              <p className="mt-0.5 text-amber-800">
                Bookings flagged with <code className="bg-amber-100 px-1 rounded font-bold">refundRequired = true</code> represent cancelled paid jobs.
                No automated refund API is available; operators must process refunds manually in Paystack test/live dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="w-full sm:w-64">
            <Select
              label="Filter by Status"
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value as BookingStatus | '');
                setOffset(0);
              }}
              options={[
                { value: 'PAYMENT_PENDING', label: 'PAYMENT_PENDING' },
                { value: 'CONFIRMED', label: 'CONFIRMED' },
                { value: 'CLEANER_ASSIGNED', label: 'CLEANER_ASSIGNED' },
                { value: 'CLEANER_EN_ROUTE', label: 'CLEANER_EN_ROUTE' },
                { value: 'CLEANER_ARRIVED', label: 'CLEANER_ARRIVED' },
                { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                { value: 'COMPLETED', label: 'COMPLETED' },
                { value: 'CANCELLED', label: 'CANCELLED' },
              ]}
              placeholder="All Statuses"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Status Filter: <span className="font-bold text-slate-800">{selectedStatusFilter || 'All'}</span>
          </div>
        </div>

        <Table
          columns={columns}
          data={bookings}
          isLoading={isLoading}
          keyExtractor={(b) => b.id}
          emptyMessage="No cleaning bookings found matching filter."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={bookings.length}
          onOffsetChange={setOffset}
        />
      </div>

      {/* Booking Detail Modal Drawer */}
      {selectedBookingId && (
        <BookingDetailPage
          bookingId={selectedBookingId}
          onClose={() => {
            setSelectedBookingId(null);
            refetch();
          }}
          onToast={(type, msg) => addToast(type, msg)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
