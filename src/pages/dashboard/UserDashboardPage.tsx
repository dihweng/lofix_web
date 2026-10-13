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
import { utilitiesApi, VtpassOrderDetail } from '../../api/utilities';
import { ElectricityReceiptModal } from '../../components/utilities/ElectricityReceiptModal';
import { authApi } from '../../api/auth';
import { CleaningBooking } from '../../api/bookings';
import { LiveJobTrackingModal } from '../../components/cleaning/LiveJobTrackingModal';
import { ReviewModal } from '../../components/cleaning/ReviewModal';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { SupportTicketModal } from '../../components/support/SupportTicketModal';
import { formatNaira } from '../../utils/money';
import { formatDate, formatStatus } from '../../utils/formatters';
import {
  CalendarCheck,
  BookmarkCheck,
  User,
  Sparkles,
  Clock,
  MapPin,
  Navigation,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Zap,
  Copy,
  RefreshCw,
  AlertCircle,
  Search,
  RotateCcw,
  ArrowRight,
  Star,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Smartphone,
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateProfile, refreshUser } = useAuth();

  const activeTabFromUrl = searchParams.get('tab') || 'buy-again';
  const [activeTab, setActiveTab] = useState<'bookings' | 'enquiries' | 'utilities' | 'buy-again' | 'properties' | 'profile'>(
    activeTabFromUrl as any
  );
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<VtpassOrderDetail | null>(null);

  useEffect(() => {
    if (activeTabFromUrl !== activeTab) {
      setActiveTab(activeTabFromUrl as any);
    }
  }, [activeTabFromUrl]);

  const switchTab = (tab: 'bookings' | 'enquiries' | 'utilities' | 'buy-again' | 'properties' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const {
    data: cleaningBookings = [],
    refetch: refetchCleaning,
  } = useQuery({
    queryKey: ['myCleaningBookings'],
    queryFn: cleaningCustomerApi.getCustomerBookings,
    retry: false,
  });

  const {
    data: shortletBookings = [],
    refetch: refetchShortlets,
  } = useQuery({
    queryKey: ['myShortletBookings'],
    queryFn: shortletCustomerApi.getCustomerBookings,
    retry: false,
  });

  const {
    data: userEnquiries = [],
  } = useQuery({
    queryKey: ['myUserEnquiries'],
    queryFn: propertyListingsApi.getUserEnquiries,
    retry: false,
  });

  const {
    data: utilityOrders = [],
    refetch: refetchUtilities,
  } = useQuery({
    queryKey: ['myUtilityOrders'],
    queryFn: utilitiesApi.getUserVtpassOrders,
    retry: false,
  });

  const [bookingTypeFilter, setBookingTypeFilter] = useState<'all' | 'cleaning' | 'shortlet'>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const [utilitySearch, setUtilitySearch] = useState('');
  const [utilityStatusFilter, setUtilityStatusFilter] = useState<'all' | 'SUCCESS' | 'PENDING' | 'FAILED'>('all');
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<CleaningBooking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<CleaningBooking | null>(null);
  const [supportModalOrder, setSupportModalOrder] = useState<any | null>(null);

  const [title, setTitle] = useState(user?.title || 'Mr');
  const [firstName, setFirstName] = useState(user?.firstName || 'Demo');
  const [lastName, setLastName] = useState(user?.lastName || 'Customer');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '08031234567');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Settings Sub-Tab Navigation State
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'security' | 'verification' | 'phone-verification' | 'delete'>('profile');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Phone Verification OTP State
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(user?.isPhoneVerified || false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
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

  const handleRequestPhoneOtp = async () => {
    setIsRequestingOtp(true);
    try {
      const res = await authApi.requestPhoneOtp();
      setPhoneOtpSent(true);
      addToast('success', res.message || 'OTP sent successfully to your phone number!');
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Failed to request phone OTP.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp.trim()) {
      addToast('error', 'Please enter the verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await authApi.verifyPhoneOtp(phoneOtp.trim());
      setIsPhoneVerified(true);
      addToast('success', res.message || 'Phone number verified successfully!');
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim()) {
      addToast('error', 'Please enter the verification code.');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const res = await authApi.verifyEmail(emailOtp.trim());
      await refreshUser();
      setEmailOtp('');
      addToast('success', res.message || 'Email address verified successfully!');
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Email verification failed.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError('New password must be between 8 and 72 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must differ from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess(res.message || 'Password changed successfully!');
      addToast('success', res.message || 'Password changed successfully! Please log in again.');

      if (res.requiresLogin) {
        const activeOrder = localStorage.getItem('lofix_active_vtpass_order_id');
        localStorage.clear();
        if (activeOrder) {
          localStorage.setItem('lofix_active_vtpass_order_id', activeOrder);
        }
        setTimeout(() => {
          window.location.href = '/?login=true&success=Password+changed+successfully';
        }, 1500);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyToken = (token: string, orderId: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(orderId);
    addToast('success', 'Token copied to clipboard!');
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleDashboardRetryOrder = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      const updated = await utilitiesApi.retryVtpassOrder(orderId);
      refetchUtilities();
      addToast('info', updated.message || 'Status check completed.');
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Status check failed.');
    } finally {
      setRetryingOrderId(null);
    }
  };

  // Demo Seed Items for Buy Again when history is empty (only successful)
  const demoSeedItems = [
    {
      id: 'demo-util-1',
      type: 'Utility Bill / Token' as const,
      title: 'ELECTRICITY • Ikeja Electric (IKEDC)',
      subtitle: 'Target: 04128938192',
      amount: 1000000,
      status: 'SUCCESS',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      actionUrl: '/utilities',
      actionLabel: 'Buy Again',
      category: 'ELECTRICITY',
      serviceID: 'ikeja-electric',
      target: '04128938192',
      amountNaira: 10000,
    },
    {
      id: 'demo-clean-1',
      type: 'Home Cleaning' as const,
      title: 'Professional Deep Home Cleaning',
      subtitle: 'Lagos (3 bed, 2 bath)',
      amount: 2500000,
      status: 'COMPLETED',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      actionUrl: '/cleaning',
      actionLabel: 'Book Again',
    },
    {
      id: 'demo-util-2',
      type: 'Utility Bill / Token' as const,
      title: 'DATA • MTN 5.0 GB Monthly',
      subtitle: 'Target: 08031234567',
      amount: 150000,
      status: 'SUCCESS',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      actionUrl: '/utilities',
      actionLabel: 'Buy Again',
      category: 'DATA',
      serviceID: 'mtn-data',
      target: '08031234567',
      amountNaira: 1500,
    },
  ];

  // Collect actual successful history items
  const actualRecentItems = [
    ...cleaningBookings
      .filter((b) => b.status === 'COMPLETED')
      .map((b) => ({
        id: `clean-${b.id}`,
        type: 'Home Cleaning' as const,
        title: `Home Cleaning (${b.priceSnapshot?.serviceName || 'Standard'})`,
        subtitle: b.propertySnapshot?.addressLine1 || 'Lagos',
        amount: b.priceSnapshot?.total || b.total,
        status: b.status,
        date: b.createdAt || new Date().toISOString(),
        actionUrl: '/cleaning',
        actionLabel: 'Book Again',
      })),
    ...shortletBookings
      .filter((s) => s.status === 'OPEN' || s.status === 'PENDING')
      .map((s) => ({
        id: `shortlet-${s.id}`,
        type: 'Shortlet Apartment' as const,
        title: `Shortlet Booking #${s.id}`,
        subtitle: `Check-in: ${s.startDate}`,
        amount: s.totalCost,
        status: s.status,
        date: s.createdAt || new Date().toISOString(),
        actionUrl: '/shortlets',
        actionLabel: 'Book Again',
      })),
    ...utilityOrders
      .filter((u) => (u.deliveryStatus || u.status) === 'SUCCESS')
      .map((u) => ({
        id: `util-${u.orderId}`,
        type: 'Utility Bill / Token' as const,
        title: `${u.type} • ${u.serviceName || u.serviceID}`,
        subtitle: `Target: ${u.target}`,
        amount: u.amount,
        status: 'SUCCESS',
        date: u.createdAt || new Date().toISOString(),
        actionUrl: '/utilities',
        actionLabel: 'Buy Again',
        category: u.type,
        serviceID: u.serviceID,
        target: u.target,
        amountNaira: u.amount / 100,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const finalRecentItems = actualRecentItems.length > 0 ? actualRecentItems : demoSeedItems;

  const filteredCleaningBookings = cleaningBookings.filter((b) => {
    if (bookingStatusFilter === 'active') return b.status !== 'COMPLETED' && b.status !== 'CANCELLED';
    if (bookingStatusFilter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  const filteredShortletBookings = shortletBookings.filter((s) => {
    if (bookingStatusFilter === 'active') return s.status !== 'CANCELLED';
    if (bookingStatusFilter === 'completed') return s.status === 'OPEN';
    return true;
  });

  const filteredUtilityOrders = utilityOrders.filter((u) => {
    const st = u.deliveryStatus || u.status;
    if (utilityStatusFilter !== 'all' && st !== utilityStatusFilter) return false;
    if (utilitySearch.trim()) {
      const q = utilitySearch.toLowerCase();
      return (
        u.orderId.toLowerCase().includes(q) ||
        u.target.toLowerCase().includes(q) ||
        u.serviceID.toLowerCase().includes(q) ||
        (u.serviceName && u.serviceName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Customer Account Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Welcome back, {user?.firstName || 'Valued Customer'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage your active bookings, reorder quick utilities, and update account settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/utilities')}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Buy Utilities
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/cleaning')}
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            >
              Book Cleaning
            </Button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            onClick={() => switchTab('buy-again')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'buy-again'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Buy Again & Reorder</span>
          </button>

          <button
            onClick={() => switchTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>My Bookings ({cleaningBookings.length + shortletBookings.length})</span>
          </button>

          <button
            onClick={() => switchTab('utilities')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'utilities'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Utility Transactions ({utilityOrders.length})</span>
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
            <span>Enquiries ({userEnquiries.length})</span>
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

        {/* TAB 1: BUY AGAIN & QUICK REORDER */}
        {activeTab === 'buy-again' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                Buy Again & Quick Reorder ({finalRecentItems.length})
              </h3>
              <p className="text-xs text-slate-500">
                Quickly reorder successful utility bills, shortlet apartments, or cleaning services (Max 10 items).
              </p>
            </div>

            {finalRecentItems.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No recent orders found</h4>
                <p className="text-xs text-slate-500">
                  Your successful service bookings and utility purchases will appear here for 1-click reordering.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => navigate('/utilities')}>
                    Buy Utilities
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {finalRecentItems.map((item) => (
                  <Card key={item.id} className="space-y-3 border-slate-200 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <Badge variant="success" size="sm">{item.type}</Badge>
                      <span className="text-[10px] text-slate-400">{formatDate(item.date)}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.subtitle}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-emerald-700 text-xs">{formatNaira(item.amount)}</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (item.type === 'Utility Bill / Token' && (item as any).category) {
                            navigate('/utilities', {
                              state: {
                                category: (item as any).category,
                                serviceID: (item as any).serviceID,
                                target: (item as any).target,
                                amountNaira: (item as any).amountNaira,
                              },
                            });
                          } else {
                            navigate(item.actionUrl);
                          }
                        }}
                        leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {item.actionLabel}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBookingTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bookingTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Bookings
                </button>
                <button
                  onClick={() => setBookingTypeFilter('cleaning')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bookingTypeFilter === 'cleaning' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cleaning ({cleaningBookings.length})
                </button>
                <button
                  onClick={() => setBookingTypeFilter('shortlet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bookingTypeFilter === 'shortlet' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Shortlets ({shortletBookings.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBookingStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    bookingStatusFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'bg-white border text-slate-600'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setBookingStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    bookingStatusFilter === 'active' ? 'bg-emerald-600 text-white font-bold' : 'bg-white border text-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setBookingStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    bookingStatusFilter === 'completed' ? 'bg-emerald-600 text-white font-bold' : 'bg-white border text-slate-600'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {filteredCleaningBookings.length === 0 && filteredShortletBookings.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No bookings found</h4>
                <p className="text-xs text-slate-500">You do not have any bookings matching the selected filter.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(bookingTypeFilter === 'all' || bookingTypeFilter === 'cleaning') &&
                  filteredCleaningBookings.map((b) => {
                    const isCompleted = b.status === 'COMPLETED';

                    return (
                      <Card key={`clean-${b.id}`} className="space-y-3 border-slate-200">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              #CLEANING-{b.reference || b.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {b.priceSnapshot?.serviceName || 'Home Cleaning'}
                            </h4>
                          </div>
                          <Badge variant={isCompleted ? 'success' : 'info'} size="sm">
                            {formatStatus(b.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="line-clamp-1">{b.propertySnapshot?.addressLine1 || 'Address on file'}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{b.scheduledAt ? formatDate(b.scheduledAt) : 'Not scheduled'}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {formatNaira(b.priceSnapshot?.total || b.total)}
                          </span>

                          <div className="flex items-center gap-2">
                            {isCompleted && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="font-bold text-xs"
                                onClick={() => setReviewBooking(b)}
                                leftIcon={<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              >
                                Leave Review
                              </Button>
                            )}

                            {!isCompleted && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="font-bold text-xs"
                                onClick={() => setTrackingBooking(b)}
                                leftIcon={<Navigation className="w-3.5 h-3.5 text-emerald-600" />}
                              >
                                Track Live
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                {(bookingTypeFilter === 'all' || bookingTypeFilter === 'shortlet') &&
                  filteredShortletBookings.map((s) => {
                    const isOpen = s.status === 'OPEN';

                    return (
                      <Card key={`shortlet-${s.id}`} className="space-y-3 border-slate-200">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              #SHORTLET-{s.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {s.apartment?.title || 'Shortlet Apartment Booking'}
                            </h4>
                          </div>
                          <Badge variant={isOpen ? 'success' : 'warning'} size="sm">
                            {formatStatus(s.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>Check-in: {s.startDate} | Check-out: {s.endDate} ({s.days} nights)</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {formatNaira(s.totalCost)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {s.createdAt ? formatDate(s.createdAt) : ''}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UTILITY TRANSACTIONS */}
        {activeTab === 'utilities' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Search order ID, target, provider..."
                  value={utilitySearch}
                  onChange={(e) => setUtilitySearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="flex items-center gap-2">
                {['all', 'SUCCESS', 'PENDING', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setUtilityStatusFilter(st as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      utilityStatusFilter === st ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredUtilityOrders.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <Zap className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No utility transactions found</h4>
                <p className="text-xs text-slate-500">You have not purchased any utility bills or tokens yet.</p>
                <div className="pt-2 flex justify-center">
                  <Button variant="primary" size="sm" onClick={() => navigate('/utilities')}>
                    Buy Utilities Now
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUtilityOrders.map((order) => {
                  const statusVal = order.deliveryStatus || order.status;
                  const isFailed = statusVal === 'FAILED' || order.requiresSupport;
                  const isSuccess = statusVal === 'SUCCESS';

                  return (
                    <Card
                      key={order.orderId || order.transactionId}
                      className="space-y-3 border-slate-200 hover:border-amber-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #ORDER-{order.orderId}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                            {order.type} • {order.serviceName || order.serviceID}
                          </h4>
                        </div>
                        <Badge
                          variant={isSuccess ? 'success' : isFailed ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {order.requiresSupport ? 'NEEDS SUPPORT' : statusVal}
                        </Badge>
                      </div>

                      {order.message && (
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-medium">
                          {order.message}
                        </div>
                      )}

                      <div className="space-y-1 text-xs text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-500">Target / Meter Number:</span>{' '}
                          <span className="font-mono font-bold text-slate-900">{order.target}</span>
                        </p>
                        {order.reference && (
                          <p className="text-[11px] font-mono text-slate-500">
                            Ref: {order.reference}
                          </p>
                        )}

                        {isSuccess && order.token && (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl my-2 space-y-1">
                            <p className="text-[10px] text-amber-800 font-bold uppercase">Electricity Token:</p>
                            <p className="text-base font-mono font-black text-amber-950 tracking-wider">
                              {order.token}
                            </p>
                            {order.units && <p className="text-[11px] text-amber-700">Units: {order.units}</p>}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 font-bold"
                              onClick={() => handleCopyToken(order.token!, order.orderId)}
                              leftIcon={<Copy className="w-3.5 h-3.5" />}
                            >
                              {copiedTokenId === order.orderId ? 'Token Copied!' : 'Copy Token'}
                            </Button>
                          </div>
                        )}

                        {isSuccess && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full font-bold text-xs mt-2"
                            onClick={() => setSelectedReceiptOrder(order)}
                          >
                            View Detailed Receipt
                          </Button>
                        )}

                        {order.requiresSupport && (
                          <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-[11px] text-red-900 space-y-2">
                            <p className="font-bold flex items-center gap-1 text-red-800">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> Support Required ({order.supportReason || 'DELIVERY_FAILED'})
                            </p>
                            <p>{order.message || order.responseDescription || 'Payment received successfully, but delivery requires manual reconciliation.'}</p>
                            <div className="p-2 bg-white rounded-lg border border-red-200 text-[10px] font-mono text-slate-700 space-y-0.5">
                              <p>Order ID: <strong>#{order.orderId}</strong></p>
                              <p>Transaction ID: <strong>#{order.transactionId}</strong></p>
                              <p>Provider Ref: <strong>{order.providerReference || order.reference || 'N/A'}</strong></p>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-1">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="w-full font-bold"
                                onClick={() => setSupportModalOrder(order)}
                              >
                                Contact Support
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full font-bold text-xs"
                                onClick={() => {
                                  addToast('info', `Support ticket ref: Order #${order.orderId}, Tx #${order.transactionId}. Please email support@lofix.ng`);
                                }}
                              >
                                Email support@lofix.ng instead
                              </Button>
                            </div>
                          </div>
                        )}

                        {isFailed && !order.requiresSupport && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900 space-y-1">
                            <p className="font-bold flex items-center gap-1 text-red-800">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Payment Received — Delivery Issue
                            </p>
                            <p>Please contact support quoting Order ID <strong>#{order.orderId}</strong> and Ref <strong>{order.reference || 'N/A'}</strong>.</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-extrabold text-emerald-700 text-sm">
                            Amount: {formatNaira(order.amount)}
                          </span>
                          {order.createdAt && (
                            <span className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</span>
                          )}
                        </div>

                        {(order.canRetry || !isSuccess) && !order.requiresSupport && (
                          <div className="pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full font-bold text-xs"
                              isLoading={retryingOrderId === order.orderId}
                              disabled={retryingOrderId === order.orderId}
                              onClick={() => handleDashboardRetryOrder(order.orderId)}
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            >
                              Check delivery again
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                My Property Enquiries ({userEnquiries.length})
              </h3>
            </div>

            {userEnquiries.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No enquiries submitted</h4>
                <p className="text-xs text-slate-500">Enquiries you send on property listings will appear here.</p>
                <div className="pt-2 flex justify-center">
                  <Button variant="primary" size="sm" onClick={() => navigate('/shortlets')}>
                    Browse Properties
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userEnquiries.map((enquiry: any) => (
                  <Card key={enquiry.id || enquiry.createdAt} className="space-y-3 border-slate-200">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Listing #{enquiry.listingId}
                      </span>
                      <Badge variant="success" size="sm">Submitted</Badge>
                    </div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      "{enquiry.message}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{enquiry.phone || 'No phone'}</span>
                      <span>{enquiry.createdAt ? formatDate(enquiry.createdAt) : ''}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SAVED PROPERTIES */}
        {activeTab === 'properties' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Saved Properties</h3>
                <p className="text-xs text-slate-500">
                  Save property addresses to speed up future home cleaning bookings.
                </p>
              </div>
            </div>

            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <BookmarkCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-700 font-bold">
                Easily manage and reuse your saved property addresses.
              </p>
            </div>
          </Card>
        )}

        {/* TAB 6: PROFILE & SETTINGS (SIDEBAR & CARDS) */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Sidebar */}
            <Card className="lg:col-span-1 p-3 space-y-1 h-fit sticky top-24">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                Account Settings
              </p>
              {[
                { id: 'profile' as const, label: 'Update Profile', icon: <User className="w-4 h-4" /> },
                { id: 'security' as const, label: 'Change Password', icon: <Lock className="w-4 h-4" /> },
                { id: 'verification' as const, label: 'Account Verification', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'phone-verification' as const, label: 'Phone Verification', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'delete' as const, label: 'Delete Account', icon: <Trash2 className="w-4 h-4 text-red-500" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettingsSubTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    settingsSubTab === item.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </Card>

            {/* Active Settings Card */}
            <div className="lg:col-span-3 space-y-6">
              {settingsSubTab === 'profile' && (
                <Card className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" /> Update Personal Profile
                      </h3>
                      <p className="text-xs text-slate-500">Modify your personal contact details and name.</p>
                    </div>
                    <Badge variant="success" size="sm">Active Account</Badge>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
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
                      helperText="Email address cannot be modified directly."
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

              {settingsSubTab === 'security' && (
                <Card className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" /> Security & Change Password
                      </h3>
                      <p className="text-xs text-slate-500">Update your account password securely (8–72 characters).</p>
                    </div>
                    <Badge variant="info" size="sm">Encrypted</Badge>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        New Password (8–72 characters)
                      </label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          maxLength={72}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          maxLength={72}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isChangingPassword}
                      leftIcon={<Lock className="w-4 h-4" />}
                    >
                      Update Password & Secure Session
                    </Button>
                  </form>
                </Card>
              )}

              {settingsSubTab === 'verification' && (
                <Card className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Verification & Status
                      </h3>
                      <p className="text-xs text-slate-500">Your account authentication and KYC status.</p>
                    </div>
                    <Badge variant={user?.isVerified !== false ? 'success' : 'warning'} size="sm">
                      {user?.isVerified !== false ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block font-semibold">Account Role</span>
                      <span className="font-bold text-slate-900">{user?.role || 'User'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Account ID</span>
                      <span className="font-mono font-bold text-slate-900">#{user?.id || 1}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Email Status</span>
                      <span className={`font-bold ${user?.isVerified === false ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {user?.isVerified === false ? 'Verification required' : 'Verified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Security State</span>
                      <span className="font-bold text-emerald-700">Session Secure</span>
                    </div>
                  </div>

                  {user?.isVerified === false && (
                    <form onSubmit={handleVerifyEmail} className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Verify your email address</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Enter the verification code sent to {user.email}.
                        </p>
                      </div>
                      <Input
                        label="Email verification code"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="Enter your code"
                        required
                      />
                      <Button type="submit" variant="primary" size="md" isLoading={isVerifyingEmail}>
                        Verify email
                      </Button>
                    </form>
                  )}
                </Card>
              )}

              {settingsSubTab === 'phone-verification' && (
                <Card className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" /> Phone Number Verification (OTP)
                      </h3>
                      <p className="text-xs text-slate-500">Verify the phone number registered to your account.</p>
                    </div>
                    <Badge variant={isPhoneVerified ? 'success' : 'warning'} size="sm">
                      {isPhoneVerified ? 'Phone Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Registered Phone Number:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{phoneNumber || user?.phoneNumber || 'No phone number'}</span>
                    </div>

                    {!phoneOtpSent ? (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          isLoading={isRequestingOtp}
                          onClick={handleRequestPhoneOtp}
                          leftIcon={<Smartphone className="w-4 h-4" />}
                        >
                          Request OTP Code
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyPhoneOtp} className="space-y-3 pt-2 border-t border-slate-200">
                        <p className="text-xs text-emerald-700 font-bold">
                          ✓ OTP code sent to your phone. Please enter it below to confirm.
                        </p>
                        <Input
                          label="Enter 6-Digit OTP Code"
                          placeholder="e.g. 123456"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          required
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            isLoading={isVerifyingOtp}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Verify OTP
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="md"
                            isLoading={isRequestingOtp}
                            onClick={handleRequestPhoneOtp}
                          >
                            Resend Code
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </Card>
              )}

              {settingsSubTab === 'delete' && (
                <Card className="space-y-5 border-red-200">
                  <div className="border-b border-red-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" /> Delete Account
                      </h3>
                      <p className="text-xs text-slate-500">Permanently remove your account and associated data.</p>
                    </div>
                    <Badge variant="danger" size="sm">Critical Action</Badge>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2 leading-relaxed">
                    <p className="font-bold">Warning: This action is irreversible.</p>
                    <p>
                      Deleting your account will remove your profile, saved addresses, and active session records. To confirm, please type your email address <strong>{user?.email}</strong> below.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Confirm Email Address"
                      placeholder="Type your email to confirm..."
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      isLoading={isDeletingAccount}
                      disabled={deleteConfirmation.trim() !== user?.email}
                      onClick={async () => {
                        if (!user) return;
                        setIsDeletingAccount(true);
                        try {
                          await authApi.deleteAccount(user.id);
                          localStorage.clear();
                          addToast('success', 'Account deleted successfully.');
                          setTimeout(() => {
                            window.location.href = '/';
                          }, 1500);
                        } catch (err: any) {
                          addToast('error', err.response?.data?.message || err.message || 'Failed to delete account.');
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      }}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Permanently Delete My Account
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </section>

      <LiveJobTrackingModal
        isOpen={!!trackingBooking}
        booking={trackingBooking}
        onClose={() => setTrackingBooking(null)}
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

      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          refetchCleaning();
          refetchShortlets();
          addToast('success', 'Payment verified successfully!');
        }}
      />

      <SupportTicketModal
        isOpen={!!supportModalOrder}
        onClose={() => setSupportModalOrder(null)}
        orderId={supportModalOrder?.orderId || ''}
        transactionId={supportModalOrder?.transactionId}
        providerReference={supportModalOrder?.providerReference || supportModalOrder?.reference}
        defaultMessage={supportModalOrder?.message}
        onEmailSupportClick={() => {
          if (supportModalOrder) {
            addToast('info', `Support ticket ref: Order #${supportModalOrder.orderId}, Tx #${supportModalOrder.transactionId}. Please email support@lofix.ng`);
          }
        }}
      />

      <ElectricityReceiptModal
        isOpen={!!selectedReceiptOrder}
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        onCopyToken={(t) => handleCopyToken(t, selectedReceiptOrder?.orderId || '')}
      />
    </CustomerLayout>
  );
};
