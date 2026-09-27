import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ToastMessage } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { shortletCustomerApi } from '../../api/shortletCustomer';
import { propertyListingsApi } from '../../api/propertyListings';
import { utilitiesApi } from '../../api/utilities';
import { CleaningBooking } from '../../api/bookings';
import { ShortletBooking } from '../../api/shortletBookings';
import { PropertyManagerModal } from '../../components/cleaning/PropertyManagerModal';
import { LiveJobTrackingModal } from '../../components/cleaning/LiveJobTrackingModal';
import { RescheduleCancelModal } from '../../components/cleaning/RescheduleCancelModal';
import { ReviewModal } from '../../components/cleaning/ReviewModal';
import { DigitalReceiptModal } from '../../components/common/DigitalReceiptModal';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { formatNaira } from '../../utils/money';
import { formatDate, formatStatus } from '../../utils/formatters';
import {
  CalendarCheck,
  BookmarkCheck,
  User,
  Sparkles,
  Building2,
  Clock,
  MapPin,
  Star,
  FileText,
  Navigation,
  Calendar,
  XCircle,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Send,
  MessageSquare,
  Zap,
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const activeTabFromUrl = searchParams.get('tab') || 'bookings';
  const [activeTab, setActiveTab] = useState<'bookings' | 'enquiries' | 'utilities' | 'properties' | 'profile'>(
    activeTabFromUrl as any
  );

  useEffect(() => {
    if (activeTabFromUrl !== activeTab) {
      setActiveTab(activeTabFromUrl as any);
    }
  }, [activeTabFromUrl]);

  const switchTab = (tab: 'bookings' | 'enquiries' | 'utilities' | 'properties' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const {
    data: cleaningBookings = [],
    refetch: refetchCleaning,
  } = useQuery({
    queryKey: ['myCleaningBookings'],
    queryFn: cleaningCustomerApi.getCustomerBookings,
    enabled: isAuthenticated,
  });

  const {
    data: shortletBookings = [],
    refetch: refetchShortlets,
  } = useQuery({
    queryKey: ['myShortletBookings'],
    queryFn: shortletCustomerApi.getCustomerBookings,
    enabled: isAuthenticated,
  });

  const {
    data: userEnquiries = [],
  } = useQuery({
    queryKey: ['myUserEnquiries'],
    queryFn: propertyListingsApi.getUserEnquiries,
    enabled: isAuthenticated,
  });

  const {
    data: utilityTransactions = [],
    refetch: refetchUtilities,
  } = useQuery({
    queryKey: ['myUtilityTransactions'],
    queryFn: utilitiesApi.getUserUtilityTransactions,
    enabled: isAuthenticated,
  });

  const [bookingTypeFilter, setBookingTypeFilter] = useState<'all' | 'cleaning' | 'shortlet'>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);
  const [isPropertyManagerOpen, setIsPropertyManagerOpen] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<CleaningBooking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<CleaningBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<CleaningBooking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<CleaningBooking | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    booking: CleaningBooking | ShortletBooking | null;
    type: 'cleaning' | 'shortlet';
  }>({ isOpen: false, booking: null, type: 'cleaning' });

  const [title, setTitle] = useState(user?.title || 'Mr');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      addToast('success', 'Profile updated successfully!');
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const isCleaningActive = (b: CleaningBooking) =>
    ['CONFIRMED', 'CLEANER_ASSIGNED', 'CLEANER_EN_ROUTE', 'CLEANER_ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING'].includes(
      b.status
    );

  const isShortletActive = (b: ShortletBooking) =>
    ['PENDING', 'OPEN'].includes(b.status);

  const filteredCleaningBookings = cleaningBookings.filter((b) => {
    if (bookingStatusFilter === 'active') return isCleaningActive(b);
    if (bookingStatusFilter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  const filteredShortletBookings = shortletBookings.filter((b) => {
    if (bookingStatusFilter === 'active') return isShortletActive(b);
    if (bookingStatusFilter === 'completed') return b.status === 'OPEN';
    return true;
  });

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      <div className="bg-slate-900 text-white py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-white">
                Welcome back, {user?.firstName || 'Customer'}!
              </h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Account
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => switchTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>My Bookings</span>
          </button>

          <button
            onClick={() => switchTab('enquiries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'enquiries'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Enquiries ({userEnquiries.length})</span>
          </button>

          <button
            onClick={() => switchTab('utilities')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'utilities'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Utility Transactions ({utilityTransactions.length})</span>
          </button>

          <button
            onClick={() => switchTab('properties')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'properties'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Saved Properties</span>
          </button>

          <button
            onClick={() => switchTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>
        </div>

        {/* TAB 1: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700">Service:</span>
                <Select
                  value={bookingTypeFilter}
                  onChange={(e) => setBookingTypeFilter(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'All Services' },
                    { value: 'cleaning', label: 'Cleaning Jobs' },
                    { value: 'shortlet', label: 'Apartment Shortlets' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <Select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active & Scheduled' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              </div>
            </div>

            {(bookingTypeFilter === 'all' || bookingTypeFilter === 'cleaning') && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Home Cleaning Bookings ({filteredCleaningBookings.length})
                </h3>

                {filteredCleaningBookings.length === 0 ? (
                  <Card className="text-center py-8 text-xs text-slate-500">
                    No cleaning bookings found in this view.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCleaningBookings.map((cb) => (
                      <Card
                        key={cb.id}
                        className="space-y-4 border-slate-200 hover:border-emerald-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-700">
                              #{cb.reference || cb.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {cb.priceSnapshot?.serviceName || 'Home Cleaning Service'}
                            </h4>
                          </div>
                          <Badge
                            variant={
                              cb.status === 'COMPLETED'
                                ? 'success'
                                : cb.status === 'CANCELLED'
                                ? 'danger'
                                : 'info'
                            }
                            size="sm"
                          >
                            {formatStatus(cb.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatDate(cb.scheduledAt)}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {cb.propertySnapshot?.addressLine1}, {cb.propertySnapshot?.city}
                            </span>
                          </p>
                          <p className="font-bold text-slate-900 pt-1">
                            Total: {formatNaira(cb.priceSnapshot?.total || cb.total)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {cb.status === 'PAYMENT_PENDING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setCheckoutTransactionId(cb.transactionId || cb.id)}
                              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            >
                              Pay Now
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTrackingBooking(cb)}
                            leftIcon={<Navigation className="w-3.5 h-3.5" />}
                          >
                            Track Live
                          </Button>

                          {cb.status !== 'COMPLETED' && cb.status !== 'CANCELLED' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRescheduleBooking(cb)}
                                leftIcon={<Calendar className="w-3.5 h-3.5" />}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelBooking(cb)}
                                className="text-red-600 hover:bg-red-50"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Cancel
                              </Button>
                            </>
                          )}

                          {cb.status === 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewBooking(cb)}
                              leftIcon={<Star className="w-3.5 h-3.5 text-amber-400" />}
                            >
                              Leave Review
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReceiptModal({ isOpen: true, booking: cb, type: 'cleaning' })
                            }
                            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-500" />}
                          >
                            Digital Receipt
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(bookingTypeFilter === 'all' || bookingTypeFilter === 'shortlet') && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Apartment Shortlet Bookings ({filteredShortletBookings.length})
                </h3>

                {filteredShortletBookings.length === 0 ? (
                  <Card className="text-center py-8 text-xs text-slate-500">
                    No shortlet bookings found in this view.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredShortletBookings.map((sb) => (
                      <Card
                        key={sb.id}
                        className="space-y-4 border-slate-200 hover:border-emerald-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-700">
                              #SHORTLET-{sb.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {sb.apartment?.title || 'Apartment Shortlet'}
                            </h4>
                          </div>
                          <Badge
                            variant={sb.status === 'OPEN' ? 'success' : 'info'}
                            size="sm"
                          >
                            {formatStatus(sb.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {formatDate(sb.startDate)} to {formatDate(sb.endDate)} ({sb.days} nights)
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{sb.apartment?.address || 'Lagos / Abuja'}</span>
                          </p>
                          <p className="font-bold text-slate-900 pt-1">
                            Total: {formatNaira(sb.totalCost)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {sb.status === 'PENDING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setCheckoutTransactionId(sb.transactionId || sb.id)}
                              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            >
                              Pay Now
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReceiptModal({ isOpen: true, booking: sb, type: 'shortlet' })
                            }
                            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-500" />}
                          >
                            Digital Receipt
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Property Enquiries ({userEnquiries.length})
            </h3>

            {userEnquiries.length === 0 ? (
              <Card className="text-center py-8 text-xs text-slate-500 space-y-2">
                <Send className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No property enquiries submitted yet.</p>
                <p>Browse Rent and Sale listings to send direct property enquiries.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/shortlets')}>
                  Browse Property Listings
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userEnquiries.map((enq) => {
                  const offer = enq.offerSnapshot || enq.listing;
                  return (
                    <Card
                      key={enq.id}
                      className="space-y-3 border-slate-200 hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                        <div>
                          <Badge variant="primary" size="sm">
                            {offer?.purpose || 'RENT'}
                          </Badge>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {offer?.title || `Property Listing #${enq.listingId}`}
                          </h4>
                        </div>
                        <Badge
                          variant={
                            enq.status === 'CLOSED'
                              ? 'neutral'
                              : enq.status === 'CONTACTED'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {enq.status || 'NEW'}
                        </Badge>
                      </div>

                      {offer && (
                        <p className="text-xs font-bold text-emerald-700">
                          Offer Price: {formatNaira(offer.price)}{' '}
                          <span className="text-slate-400 font-normal">
                            {offer.pricePeriod ? `/ ${offer.pricePeriod}` : ''}
                          </span>
                        </p>
                      )}

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic space-y-1">
                        <p className="font-semibold text-slate-500 not-italic text-[10px]">
                          Enquiry Message:
                        </p>
                        <p>"{enq.message}"</p>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Submitted on {formatDate(enq.createdAt)}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UTILITY TRANSACTIONS */}
        {activeTab === 'utilities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Utility Bills & Recharge Transactions ({utilityTransactions.length})
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/utilities')}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Buy Utility Bills
              </Button>
            </div>

            {utilityTransactions.length === 0 ? (
              <Card className="text-center py-8 text-xs text-slate-500 space-y-2">
                <Zap className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="font-bold text-slate-700">No utility transactions yet.</p>
                <p>Buy electricity tokens, mobile data bundles, airtime or cable TV instantly.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/utilities')}>
                  Buy Utility Bills
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {utilityTransactions.map((tx) => (
                  <Card
                    key={tx.id}
                    className="space-y-3 border-slate-200 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{tx.reference || tx.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {tx.category} • {tx.providerName || tx.providerId}
                        </h4>
                      </div>
                      <Badge
                        variant={tx.status === 'SUCCESSFUL' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {tx.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-500">Account / Meter Number:</span>{' '}
                        <span className="font-mono font-bold text-slate-900">{tx.accountNumber}</span>
                      </p>
                      {tx.customerName && (
                        <p>
                          <span className="font-semibold text-slate-500">Customer:</span> {tx.customerName}
                        </p>
                      )}
                      {tx.token && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl my-2">
                          <p className="text-[10px] text-amber-800 font-bold uppercase">Electricity Token:</p>
                          <p className="text-sm font-mono font-extrabold text-amber-900 tracking-wider">
                            {tx.token}
                          </p>
                          {tx.units && <p className="text-[10px] text-amber-700 mt-0.5">Units: {tx.units}</p>}
                        </div>
                      )}
                      <p className="font-extrabold text-emerald-700 pt-1 text-sm">
                        Amount Paid: {formatNaira(tx.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">Date: {formatDate(tx.createdAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED PROPERTIES */}
        {activeTab === 'properties' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Saved Properties</h3>
                <p className="text-xs text-slate-500">
                  Save property addresses to speed up future home cleaning bookings.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPropertyManagerOpen(true)}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Open Property Manager
              </Button>
            </div>

            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <BookmarkCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-700 font-bold">
                Easily manage and reuse your saved property addresses.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPropertyManagerOpen(true)}
              >
                Manage Saved Properties
              </Button>
            </div>
          </Card>
        )}

        {/* TAB 5: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <Card className="max-w-xl space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Profile & Contact Settings</h3>
              <p className="text-xs text-slate-500">Update your account information.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Select
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  options={[
                    { value: 'Mr', label: 'Mr.' },
                    { value: 'Mrs', label: 'Mrs.' },
                    { value: 'Ms', label: 'Ms.' },
                    { value: 'Dr', label: 'Dr.' },
                  ]}
                />
                <div className="col-span-2">
                  <Input
                    label="First Name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              <Input
                label="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <Input
                label="Email Address"
                disabled
                value={user?.email || ''}
                helperText="Email cannot be changed directly."
              />

              <Input
                label="Phone Number"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdatingProfile}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </form>
          </Card>
        )}
      </div>

      <PropertyManagerModal
        isOpen={isPropertyManagerOpen}
        onClose={() => setIsPropertyManagerOpen(false)}
      />

      <LiveJobTrackingModal
        isOpen={!!trackingBooking}
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
      />

      <RescheduleCancelModal
        isOpen={!!rescheduleBooking}
        booking={rescheduleBooking}
        mode="reschedule"
        onClose={() => setRescheduleBooking(null)}
        onSuccess={() => {
          refetchCleaning();
          addToast('success', 'Booking rescheduled successfully.');
        }}
      />

      <RescheduleCancelModal
        isOpen={!!cancelBooking}
        booking={cancelBooking}
        mode="cancel"
        onClose={() => setCancelBooking(null)}
        onSuccess={() => {
          refetchCleaning();
          addToast('success', 'Booking cancelled.');
        }}
      />

      <ReviewModal
        isOpen={!!reviewBooking}
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={() => {
          refetchCleaning();
          addToast('success', 'Thank you for submitting your review!');
        }}
      />

      <DigitalReceiptModal
        isOpen={receiptModal.isOpen}
        booking={receiptModal.booking}
        type={receiptModal.type}
        onClose={() => setReceiptModal({ isOpen: false, booking: null, type: 'cleaning' })}
      />

      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          refetchCleaning();
          refetchShortlets();
          refetchUtilities();
          addToast('success', 'Payment verified successfully!');
        }}
        onCancel={() => {
          addToast('info', 'Payment modal closed.');
        }}
      />
    </CustomerLayout>
  );
};
