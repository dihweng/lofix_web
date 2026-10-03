import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shortletCustomerApi } from '../../api/shortletCustomer';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ToastMessage } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import { AuthModals } from '../../components/auth/AuthModals';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { formatNaira } from '../../utils/money';
import {
  MapPin,
  Tv,
  Wind,
  Utensils,
  Zap,
  Droplet,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Info,
} from 'lucide-react';

export const ShortletDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: 'apartment' | 'room'; id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const isApartment = type === 'apartment';
  const entityId = parseInt(id || '0', 10);

  const { data: apartment, isLoading: isLoadingApt } = useQuery({
    queryKey: ['apartment', entityId],
    queryFn: () => shortletCustomerApi.getApartmentById(entityId),
    enabled: isApartment && !!entityId,
  });

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['room', entityId],
    queryFn: () => shortletCustomerApi.getRoomById(entityId),
    enabled: !isApartment && !!entityId,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDateForInput(tomorrow));
  const [endDate, setEndDate] = useState(formatDateForInput(dayAfter));
  const [note, setNote] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  const pricePerNightKobo = isApartment ? apartment?.price || 0 : room?.price || 0;
  const totalCostKobo = pricePerNightKobo * nights;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('info', 'Please sign in or register to complete your shortlet booking.');
      setIsAuthModalOpen(true);
      return;
    }

    if (nights <= 0 || isNaN(nights)) {
      addToast('error', 'Please select a valid Check-out date after Check-in date.');
      return;
    }

    setIsBookingLoading(true);

    try {
      const booking = await shortletCustomerApi.createBooking({
        apartmentId: isApartment ? entityId : room?.apartmentId || entityId,
        roomId: !isApartment ? entityId : undefined,
        startDate,
        endDate,
        note,
      });

      const txId = booking.transactionId || booking.id;
      addToast('success', `Shortlet Booking #${booking.id} created! Opening checkout...`);
      setCheckoutTransactionId(txId);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Booking creation failed.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const isLoading = isLoadingApt || isLoadingRoom;
  const title = isApartment ? apartment?.title : room?.title;
  const description = isApartment ? apartment?.description : room?.description;
  const address = isApartment ? apartment?.address : room?.apartment?.address || 'Lagos / Abuja';

  const property = apartment || room?.apartment;
  const galleryImages = property?.imageUrls?.length ? property.imageUrls : property?.images?.length ? property.images.map(image => image.url) : property?.imageUrl ? [property.imageUrl] : [];

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      <div className="bg-slate-900 text-white py-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/shortlets')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-300 hover:text-white mb-2"
          >
            Back to Shortlets
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl"></div>
        ) : !title ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-800">Property Not Found</h3>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/shortlets')}>
              Browse Available Shortlets
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" size="md">
                    {isApartment ? apartment?.apartmentType || 'APARTMENT' : `${room?.bedType || 'SINGLE'} BED`}
                  </Badge>
                  <Badge variant="success" size="md">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verified Listing
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">{title}</h1>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{address}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {galleryImages.length ? galleryImages.map((url, index) => <img key={url} src={url} alt={`${title} image ${index + 1}`} className="w-full h-64 object-cover rounded-xl" />) : <div className="p-12 bg-slate-100 rounded-xl">No property images available</div>}
              </div>

              <Card className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Property Overview</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {description || 'Enjoy a comfortable, fully serviced shortlet stay featuring modern furnishings, high-speed WiFi, uninterrupted electricity, and top-tier security.'}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Included Amenities</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>24/7 Uninterrupted Power</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Wind className="w-4 h-4 text-sky-500" />
                      <span>Air Conditioning</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Tv className="w-4 h-4 text-amber-500" />
                      <span>Smart TV & DSTV</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Utensils className="w-4 h-4 text-emerald-500" />
                      <span>Equipped Kitchen</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span>Running Water</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Gated Estate Security</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-emerald-500/30 shadow-md sticky top-24">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900 font-display">
                      {formatNaira(pricePerNightKobo)}
                    </span>
                    <span className="text-xs text-slate-500"> / night</span>
                  </div>
                  <Badge variant="success" size="sm">
                    Instant Booking
                  </Badge>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Check-in Date"
                      type="date"
                      required
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="Check-out Date"
                      type="date"
                      required
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Guest Notes / Special Requests"
                    placeholder="e.g. Estimated arrival time, extra keys..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Nightly Rate</span>
                      <span>{formatNaira(pricePerNightKobo)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Duration</span>
                      <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Price</span>
                      <span className="text-emerald-700">{formatNaira(totalCostKobo)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isBookingLoading}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Proceed to Checkout
                  </Button>

                  <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protected by Lofix 100% Guest Satisfaction Guarantee</span>
                  </p>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AuthModals
        isOpen={isAuthModalOpen}
        mode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={() => {}}
      />

      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          addToast('success', 'Shortlet payment verified! Booking confirmed.');
          setTimeout(() => {
            navigate('/dashboard?tab=bookings');
          }, 1200);
        }}
        onCancel={() => {
          addToast('info', 'Payment paused. You can complete payment anytime in My Bookings.');
        }}
      />
    </CustomerLayout>
  );
};
