import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  propertyListingsApi,
  ShortletQuoteResponse,
} from '../../api/propertyListings';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ToastMessage } from '../../components/common/Toast';
import { EnquiryModal } from '../../components/listings/EnquiryModal';
import { PriceChangeAcceptanceModal } from '../../components/listings/PriceChangeAcceptanceModal';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { formatNaira } from '../../utils/money';
import { useAuth } from '../../context/AuthContext';
import { AuthModals } from '../../components/auth/AuthModals';
import {
  MapPin,
  Bed,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Info,
  Send,
  AlertCircle,
  PhoneCall,
  User,
} from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const listingId = parseInt(id || '0', 10);

  const { data: listing, isLoading: isLoadingListing } = useQuery({
    queryKey: ['propertyListingDetail', listingId],
    queryFn: () => propertyListingsApi.getListingById(listingId),
    enabled: listingId > 0,
  });

  const isShortlet = String(listing?.purpose || '').toUpperCase() === 'SHORTLET';

  const { data: config } = useQuery({
    queryKey: ['shortletConfig', listingId],
    queryFn: () => propertyListingsApi.getShortletConfig(listingId),
    enabled: isShortlet && listingId > 0,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDateYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDateYYYYMMDD(tomorrow));
  const [endDate, setEndDate] = useState(formatDateYYYYMMDD(dayAfter));
  const [guests, setGuests] = useState<number>(2);

  const [quote, setQuote] = useState<ShortletQuoteResponse | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    bookingId: number;
    transactionId: number;
    serverTotal: number;
  } | null>(null);

  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!isShortlet || !listingId || !startDate || !endDate) return;

    const fetchQuote = async () => {
      setIsCalculatingQuote(true);
      setQuoteError(null);
      try {
        const res = await propertyListingsApi.getShortletQuote(listingId, {
          startDate,
          endDate,
          guests,
        });
        setQuote(res);
      } catch (err: any) {
        setQuote(null);
        setQuoteError(
          err.response?.data?.message || err.message || 'Selected dates are unavailable.'
        );
      } finally {
        setIsCalculatingQuote(false);
      }
    };

    const timer = setTimeout(fetchQuote, 300);
    return () => clearTimeout(timer);
  }, [isShortlet, listingId, startDate, endDate, guests]);

  const handleShortletBookNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('info', 'Please sign in or register to book this shortlet stay.');
      setIsAuthModalOpen(true);
      return;
    }

    if (isBookingLoading) return;

    setIsBookingLoading(true);

    try {
      const result = await propertyListingsApi.createShortletBooking(listingId, {
        startDate,
        endDate,
        guests,
      });

      if (quote && result.total !== quote.total) {
        setPendingBooking({
          bookingId: result.bookingId,
          transactionId: result.transactionId,
          serverTotal: result.total,
        });
      } else {
        addToast('success', `Booking #${result.bookingId} created! Launching checkout...`);
        setCheckoutTransactionId(result.transactionId);
      }
    } catch (err: any) {
      addToast(
        'error',
        err.response?.data?.message || err.message || 'Booking creation failed. Please try again.'
      );
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleAcceptPriceChange = () => {
    if (pendingBooking) {
      setCheckoutTransactionId(pendingBooking.transactionId);
      setPendingBooking(null);
    }
  };

  const galleryImages = listing?.images || [];

  const formattedPrice = formatNaira(listing?.price || 0);
  const periodText = listing?.pricePeriod ? `/ ${listing.pricePeriod}` : '';

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
            Back to Property Listings
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingListing ? (
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl"></div>
        ) : !listing ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-800">Property Listing Not Found</h3>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/shortlets')}>
              Browse Available Listings
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" size="md">
                    {listing.purpose}
                  </Badge>
                  <Badge variant="info" size="md">
                    {listing.propertyType}
                  </Badge>
                  <Badge variant="success" size="md">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Listing
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
                  {listing.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{listing.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {galleryImages.length ? galleryImages.map((url, index) => <img key={url} src={url} alt={`${listing.title} image ${index + 1}`} className="w-full h-64 object-cover rounded-xl" />) : <div className="p-12 bg-slate-100 rounded-xl">No property images available</div>}
              </div>

              <Card className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Property Description</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {listing.description || 'Verified property listing offering premium specifications, modern finishings, and strategic location.'}
                </p>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-700">
                  {listing.bedrooms !== undefined && (
                    <span className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <Bed className="w-4 h-4 text-emerald-600" />
                      {listing.bedrooms} Bedrooms
                    </span>
                  )}
                  {listing.bathrooms !== undefined && (
                    <span className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-emerald-600" />
                      {listing.bathrooms} Bathrooms
                    </span>
                  )}
                </div>

                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Included Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.map((amenity, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-emerald-500/30 shadow-md sticky top-24">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900 font-display">
                      {formattedPrice}
                    </span>
                    <span className="text-xs text-slate-500"> {periodText}</span>
                  </div>
                  <Badge variant={isShortlet ? 'success' : 'info'} size="sm">
                    {isShortlet ? 'Shortlet Booking' : `${listing.purpose} Offer`}
                  </Badge>
                </div>

                {!isShortlet ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {listing.owner?.firstName ? `${listing.owner.firstName} ${listing.owner.lastName}` : 'Verified Lofix Agent'}
                        </p>
                        <p className="text-[11px] text-slate-500">Property Listing Agent</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Interested in this property for {listing.purpose.toLowerCase()}? Get in touch with the assigned listing agent to arrange an inspection or ask questions.
                    </p>

                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="w-full font-bold"
                        onClick={() => {
                          if (!isAuthenticated) setIsAuthModalOpen(true);
                          else setIsEnquiryModalOpen(true);
                        }}
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        Contact Agent / Enquire
                      </Button>

                      {listing.owner?.phoneNumber && (
                        <a
                          href={`tel:${listing.owner.phoneNumber}`}
                          className="inline-flex items-center justify-center font-medium rounded-lg transition-all border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 text-base gap-2.5 w-full text-xs font-bold"
                        >
                          <PhoneCall className="w-4 h-4 text-emerald-600" />
                          <span>Call Agent ({listing.owner.phoneNumber})</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleShortletBookNow} className="space-y-4">
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
                      label="Number of Guests"
                      type="number"
                      min="1"
                      max={config?.maxGuests || 10}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)}
                    />

                    {isCalculatingQuote ? (
                      <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                    ) : quoteError ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>{quoteError}</span>
                      </div>
                    ) : quote ? (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Nightly Rate</span>
                          <span>{formatNaira(quote.nightlyPrice)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Duration</span>
                          <span>{quote.nights} Nights</span>
                        </div>
                        {quote.cleaningFee > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Cleaning Fee</span>
                            <span>+{formatNaira(quote.cleaningFee)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                          <span>Quote Total</span>
                          <span className="text-emerald-700">{formatNaira(quote.total)}</span>
                        </div>
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full font-bold"
                      isLoading={isBookingLoading}
                      disabled={isBookingLoading || isCalculatingQuote || !!quoteError}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Book & Pay Instantly
                    </Button>
                  </form>
                )}

                <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1 mt-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Protected by Lofix Real Estate Guarantee</span>
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>

      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        listing={listing || null}
        onClose={() => setIsEnquiryModalOpen(false)}
        onSuccess={() => {
          addToast('success', 'Enquiry sent! View status in My Enquiries on dashboard.');
        }}
      />

      <PriceChangeAcceptanceModal
        isOpen={!!pendingBooking}
        quotedTotal={quote?.total || 0}
        serverTotal={pendingBooking?.serverTotal || 0}
        onAccept={handleAcceptPriceChange}
        onDecline={() => setPendingBooking(null)}
      />

      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          addToast('success', 'Listing shortlet payment verified! Booking confirmed.');
          setTimeout(() => {
            navigate('/dashboard?tab=bookings');
          }, 1200);
        }}
      />

      <AuthModals
        isOpen={isAuthModalOpen}
        mode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={() => {}}
      />
    </CustomerLayout>
  );
};
