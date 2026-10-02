import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cleaningCustomerApi, SavedProperty } from '../../api/cleaningCustomer';
import {
  PriceSnapshot,
  FurnishingState,
  SuppliesPreference,
  CleaningFrequency,
} from '../../api/bookings';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { PropertyManagerModal } from '../../components/cleaning/PropertyManagerModal';
import { PriceChangeAcceptanceModal } from '../../components/listings/PriceChangeAcceptanceModal';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { formatNaira } from '../../utils/money';
import { useAuth } from '../../context/AuthContext';
import { AuthModals } from '../../components/auth/AuthModals';
import {
  Sparkles,
  Calculator,
  Layers,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Info,
  Clock,
  Users,
  PackageCheck,
  Sparkle,
  CalendarDays,
  Bed,
  Tv,
  Utensils,
} from 'lucide-react';

export const CleaningCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: services = [] } = useQuery({
    queryKey: ['cleaningServices'],
    queryFn: cleaningCustomerApi.getServices,
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ['propertyTypes'],
    queryFn: cleaningCustomerApi.getPropertyTypes,
  });

  const { data: addonsList = [] } = useQuery({
    queryKey: ['addons'],
    queryFn: cleaningCustomerApi.getAddons,
  });

  const {
    data: dishwashingCatalogue = [],
    isLoading: isDishwashingLoading,
    isError: isDishwashingError,
    error: dishwashingFetchError,
  } = useQuery({
    queryKey: ['dishwashingCatalogueItems'],
    queryFn: () => cleaningCustomerApi.getDishwashingItems(),
  });

  const { data: savedProperties = [], refetch: refetchProperties } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: cleaningCustomerApi.getSavedProperties,
    enabled: isAuthenticated,
  });

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<number | null>(null);

  // Split Room Counts — Defaults: Bedrooms = 1, Living = 0, Bathrooms = 1, Floors = 1, Kitchens = 1
  const [numberOfBedrooms, setNumberOfBedrooms] = useState<number>(1);
  const [numberOfLivingRooms, setNumberOfLivingRooms] = useState<number>(0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState<number>(1);
  const [numberOfFloors, setNumberOfFloors] = useState<number>(1);

  // Optional Area
  const [dontKnowArea, setDontKnowArea] = useState<boolean>(true);
  const [squareMetersInput, setSquareMetersInput] = useState<string>('100');

  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [selectedDishwashingQuantities, setSelectedDishwashingQuantities] = useState<Record<number, number>>({});

  // Preferences
  const [furnishingState, setFurnishingState] = useState<FurnishingState>('OCCUPIED');
  const [suppliesPreference, setSuppliesPreference] = useState<SuppliesPreference>('SUPPLIES_INCLUDED');
  const [frequency, setFrequency] = useState<CleaningFrequency>('ONE_TIME');

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isLegacyProperty, setIsLegacyProperty] = useState<boolean>(false);
  const [legacyRoomTotal, setLegacyRoomTotal] = useState<number | null>(null);

  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [customerNote, setCustomerNote] = useState<string>('');

  const [quoteSnapshot, setQuoteSnapshot] = useState<PriceSnapshot | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);

  // Price change detection modal state
  const [pendingBooking, setPendingBooking] = useState<{
    bookingId: number;
    transactionId: number;
    serverTotal: number;
  } | null>(null);

  // Modals & Payment State
  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);
  const [isPropertyManagerOpen, setIsPropertyManagerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Out-of-order response protection ref
  const quoteRequestIdRef = useRef<number>(0);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (propertyTypes.length > 0 && !selectedPropertyTypeId) {
      setSelectedPropertyTypeId(propertyTypes[0].id);
    }
  }, [propertyTypes, selectedPropertyTypeId]);

  useEffect(() => {
    if (savedProperties.length > 0 && !selectedPropertyId) {
      const firstProp = savedProperties[0];
      setSelectedPropertyId(firstProp.id);
      syncDimensionsFromProperty(firstProp);
    }
  }, [savedProperties, selectedPropertyId]);

  const syncDimensionsFromProperty = (prop: SavedProperty) => {
    if (prop.propertyTypeId) setSelectedPropertyTypeId(prop.propertyTypeId);
    if (prop.numberOfBathrooms) setNumberOfBathrooms(prop.numberOfBathrooms);
    if (prop.numberOfFloors) setNumberOfFloors(prop.numberOfFloors);

    const hasSplit = prop.numberOfBedrooms !== undefined && prop.numberOfBedrooms !== null;

    if (hasSplit) {
      setIsLegacyProperty(false);
      setLegacyRoomTotal(null);
      setNumberOfBedrooms(prop.numberOfBedrooms || 1);
      setNumberOfLivingRooms(prop.numberOfLivingRooms || 0);
    } else {
      // Legacy total-only property
      setIsLegacyProperty(true);
      setLegacyRoomTotal(prop.numberOfRooms || 1);
      setNumberOfBedrooms(prop.numberOfRooms || 1);
      setNumberOfLivingRooms(0);
    }

    if (prop.squareMeters !== undefined && prop.squareMeters !== null && prop.squareMeters > 0) {
      setDontKnowArea(false);
      setSquareMetersInput(String(prop.squareMeters));
    } else {
      setDontKnowArea(true);
      setSquareMetersInput('100');
    }
  };

  const handleSelectSavedProperty = (prop: SavedProperty) => {
    setSelectedPropertyId(prop.id);
    syncDimensionsFromProperty(prop);
  };

  // Dishwashing quantity helper
  const handleDishwashingQuantityChange = (itemId: number, delta: number) => {
    setSelectedDishwashingQuantities((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.min(1000, Math.max(0, current + delta));
      return { ...prev, [itemId]: updated };
    });
  };

  // Format Dishwashing items payload (omitting 0 quantities, unique item IDs)
  const getDishwashingPayload = () => {
    return Object.entries(selectedDishwashingQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemIdStr, quantity]) => ({
        itemId: parseInt(itemIdStr, 10),
        quantity: Math.min(1000, Math.max(1, quantity)),
      }))
      .slice(0, 50); // Maximum 50 item types
  };

  // Live Quote Calculation with Out-of-Order protection
  useEffect(() => {
    if (!selectedServiceId || !selectedPropertyTypeId) return;

    const currentRequestId = ++quoteRequestIdRef.current;

    const calculate = async () => {
      setIsCalculating(true);
      setQuoteError(null);
      try {
        const addonPayload = Object.entries(selectedAddons)
          .filter(([_, qty]) => qty > 0)
          .map(([addonId, quantity]) => ({ addonId: parseInt(addonId, 10), quantity }));

        const dishwashingItemsPayload = getDishwashingPayload();

        const sqMetersValue = dontKnowArea ? null : (parseInt(squareMetersInput, 10) || null);

        const res = await cleaningCustomerApi.calculateQuote({
          serviceId: selectedServiceId,
          propertyTypeId: selectedPropertyTypeId,
          numberOfBedrooms,
          numberOfLivingRooms,
          numberOfBathrooms,
          numberOfFloors,
          squareMeters: sqMetersValue,
          furnishingState,
          suppliesPreference,
          frequency,
          addons: addonPayload,
          dishwashingItems: dishwashingItemsPayload,
        });

        // Discard stale out-of-order response
        if (currentRequestId === quoteRequestIdRef.current) {
          setQuoteSnapshot(res);
        }
      } catch (err: any) {
        if (currentRequestId === quoteRequestIdRef.current) {
          console.warn('[CleaningCalculatorPage] Quote calculation error:', err);
          setQuoteSnapshot(null);
          const detail =
            err.response?.data?.message ||
            err.message ||
            'No pricing rule configured for this service and selection.';
          setQuoteError(detail);
        }
      } finally {
        if (currentRequestId === quoteRequestIdRef.current) {
          setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(calculate, 500);
    return () => clearTimeout(timer);
  }, [
    selectedServiceId,
    selectedPropertyTypeId,
    numberOfBedrooms,
    numberOfLivingRooms,
    numberOfBathrooms,
    numberOfFloors,
    dontKnowArea,
    squareMetersInput,
    furnishingState,
    suppliesPreference,
    frequency,
    selectedAddons,
    selectedDishwashingQuantities,
  ]);

  const handleAddonQuantityChange = (addonId: number, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [addonId]: updated };
    });
  };

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('info', 'Please sign in or register to schedule your cleaning booking.');
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedPropertyId) {
      addToast('error', 'Please select or add a saved property address to continue.');
      setIsPropertyManagerOpen(true);
      return;
    }

    if (!selectedServiceId) {
      addToast('error', 'Please select a cleaning service.');
      return;
    }

    if (isBookingLoading || isCalculating || !!quoteError) return;

    setIsBookingLoading(true);

    try {
      // 1. Auto-save current dimensions to selected property first
      const sqMetersValue = dontKnowArea ? null : (parseInt(squareMetersInput, 10) || null);
      const targetProperty = savedProperties.find((p) => p.id === selectedPropertyId);

      const needsPropertyUpdate =
        isLegacyProperty ||
        !targetProperty ||
        targetProperty.numberOfBedrooms !== numberOfBedrooms ||
        targetProperty.numberOfLivingRooms !== numberOfLivingRooms ||
        targetProperty.numberOfBathrooms !== numberOfBathrooms ||
        targetProperty.numberOfFloors !== numberOfFloors ||
        targetProperty.propertyTypeId !== selectedPropertyTypeId ||
        targetProperty.squareMeters !== sqMetersValue;

      if (needsPropertyUpdate && targetProperty) {
        await cleaningCustomerApi.updateSavedProperty(targetProperty.id, {
          name: targetProperty.name,
          addressLine1: targetProperty.addressLine1,
          addressLine2: targetProperty.addressLine2,
          city: targetProperty.city,
          state: targetProperty.state,
          country: targetProperty.country || 'Nigeria',
          accessInstructions: targetProperty.accessInstructions,
          propertyTypeId: selectedPropertyTypeId || targetProperty.propertyTypeId || 1,
          numberOfBedrooms,
          numberOfLivingRooms,
          numberOfBathrooms,
          numberOfFloors,
          squareMeters: sqMetersValue,
        });
        await refetchProperties();
      }

      // 2. Submit booking payload with exact dishwashing payload used for quote
      const addonPayload = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, quantity]) => ({ addonId: parseInt(addonId, 10), quantity }));

      const dishwashingPayload = getDishwashingPayload();

      const booking = await cleaningCustomerApi.createBooking({
        propertyId: selectedPropertyId,
        serviceId: selectedServiceId,
        scheduledAt,
        furnishingState,
        suppliesPreference,
        frequency,
        customerNote: customerNote.trim(),
        addons: addonPayload,
        dishwashingItems: dishwashingPayload,
      });

      const txId = booking.transactionId || booking.id;

      if (quoteSnapshot && booking.total !== quoteSnapshot.total) {
        setPendingBooking({
          bookingId: booking.id,
          transactionId: txId,
          serverTotal: booking.total,
        });
      } else {
        addToast('success', `Cleaning Job created! Launching payment checkout...`);
        setCheckoutTransactionId(txId);
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Cleaning booking failed.');
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

  const totalRoomsCount = numberOfBedrooms + numberOfLivingRooms;

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Instant Price Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              Calculate & Book Professional Home Cleaning
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Transparent, real-time pricing calculated dynamically based on your room breakdown (bedrooms & parlours), options, dishwashing, and custom add-ons.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 text-xs space-y-2 max-w-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Satisfaction Guarantee</span>
            </div>
            <p className="text-slate-300">
              Vetted background-checked cleaning field agents, eco-friendly supplies, and live real-time job tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Cleaning Service */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  1
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Choose Cleaning Service</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {services.map((svc) => {
                  const isSelected = selectedServiceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-3.5 right-3.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900 pr-6">{svc.name}</h4>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {svc.description || 'Comprehensive home cleaning with professional eco-supplies.'}
                      </p>
                      <span className="inline-block mt-3 text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2.5 py-1 rounded-md">
                        Est. {svc.estimatedDurationMinutes || 120} mins
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Step 2: Property Type & Room-Based Layout */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  2
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Property Type & Room Breakdown</h3>
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Property Type
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {propertyTypes.map((pt) => {
                    const isSelected = selectedPropertyTypeId === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setSelectedPropertyTypeId(pt.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pt.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guidance Callout for Room Breakdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600 leading-relaxed mt-3 sm:mt-4">
                <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Room-Based Pricing Note:</strong> A main sitting room, separate lounge, or children's parlour each counts as a living room. Bedrooms and living rooms share the same room rate. Corridors, lobbies, porches, or balconies do not count as full rooms.
                </span>
              </div>

              {isLegacyProperty && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Selected property has a legacy room total ({legacyRoomTotal} rooms). Please specify the breakdown of Bedrooms and Living Rooms below.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Bedrooms Counter */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-emerald-600" /> Bedrooms
                    </span>
                    <p className="text-[10px] text-slate-500">Sleeping bedrooms</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNumberOfBedrooms(Math.max(1, numberOfBedrooms - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-extrabold text-slate-900">
                      {numberOfBedrooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumberOfBedrooms(numberOfBedrooms + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Living Rooms / Parlours Counter */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-emerald-600" /> Living Rooms / Parlours
                    </span>
                    <p className="text-[10px] text-slate-500">Sitting rooms & lounges</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNumberOfLivingRooms(Math.max(0, numberOfLivingRooms - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-extrabold text-slate-900">
                      {numberOfLivingRooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumberOfLivingRooms(numberOfLivingRooms + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bathrooms Counter */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" /> Bathrooms
                    </span>
                    <p className="text-[10px] text-slate-500">Full/half baths</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNumberOfBathrooms(Math.max(1, numberOfBathrooms - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-extrabold text-slate-900">
                      {numberOfBathrooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumberOfBathrooms(numberOfBathrooms + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Floors Counter */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" /> Floors
                    </span>
                    <p className="text-[10px] text-slate-500">Building levels</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNumberOfFloors(Math.max(1, numberOfFloors - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-extrabold text-slate-900">
                      {numberOfFloors}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumberOfFloors(numberOfFloors + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Area (Optional with "I don't know") */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4 sm:mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Area in square metres (optional)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontKnowArea}
                      onChange={(e) => setDontKnowArea(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I don't know</span>
                  </label>
                </div>

                {!dontKnowArea && (
                  <Input
                    type="number"
                    min="10"
                    value={squareMetersInput}
                    onChange={(e) => setSquareMetersInput(e.target.value)}
                    placeholder="e.g. 100"
                  />
                )}
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Area does not affect this room-based price.</span>
                </p>
              </div>
            </Card>

            {/* Step 3: Cleaning Condition, Supplies & Frequency Selectors */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  3
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Cleaning Preferences & Options</h3>
              </div>

              {/* Furnishing / Condition */}
              <div className="space-y-2.5 pt-2 sm:pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkle className="w-4 h-4 text-emerald-600" /> Property Condition
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'OCCUPIED' as const, label: 'Occupied Property', desc: 'Standard lived-in home' },
                    { id: 'MOVE_IN_OUT' as const, label: 'Move-in / Move-out', desc: '+20% deep empty clean' },
                    { id: 'POST_CONSTRUCTION' as const, label: 'Post-Construction', desc: '+50% heavy debris clean' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFurnishingState(opt.id)}
                      className={`p-3.5 text-left rounded-xl border text-xs transition-all ${
                        furnishingState === opt.id
                          ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Supplies */}
              <div className="space-y-2.5 pt-4 sm:pt-5 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" /> Cleaning Supplies
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'SUPPLIES_INCLUDED' as const, label: 'Cleaning Supplies Included', desc: 'Field agent brings all eco-supplies' },
                    { id: 'CUSTOMER_PROVIDED' as const, label: 'I Will Provide Supplies', desc: 'Save 10% on cleaning charges' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSuppliesPreference(opt.id)}
                      className={`p-3.5 text-left rounded-xl border text-xs transition-all ${
                        suppliesPreference === opt.id
                          ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-2.5 pt-4 sm:pt-5 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" /> Service Frequency Discount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'ONE_TIME' as const, label: 'One-time', desc: 'Standard rate' },
                    { id: 'WEEKLY' as const, label: 'Weekly', desc: 'Save 15%' },
                    { id: 'BI_WEEKLY' as const, label: 'Every 2 Weeks', desc: 'Save 10%' },
                    { id: 'MONTHLY' as const, label: 'Monthly', desc: 'Save 5%' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFrequency(opt.id)}
                      className={`p-3 text-left rounded-xl border text-xs transition-all ${
                        frequency === opt.id
                          ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed mt-2">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Frequency selection affects this booking's price only. It does not automatically schedule future visits or recurring payments.
                  </span>
                </div>
              </div>
            </Card>

            {/* Step 4: Add-Ons & Quantity-Based Dishwashing Catalogue */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  4
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Select Add-On Services & Dishwashing</h3>
              </div>

              {/* Standard Addons */}
              {addonsList.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Standard Add-Ons
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addonsList.map((addon) => {
                      const qty = selectedAddons[addon.id] || 0;
                      return (
                        <div
                          key={addon.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            qty > 0 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{addon.name}</p>
                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              +{formatNaira(addon.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddonQuantityChange(addon.id, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold text-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-extrabold text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddonQuantityChange(addon.id, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Official Dishwashing Catalogue Items */}
              <div className="space-y-4 pt-4 sm:pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-600" /> Dishwashing Catalogue
                  </label>
                  <Badge variant="success" size="sm">
                    Live Active Items
                  </Badge>
                </div>

                {/* Explanatory Unit & Set Guidance Banner */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Dishwashing Units & Selection Rules</span>
                  </div>
                  <ul className="space-y-1 pl-6 list-disc text-[11px] text-slate-600">
                    <li><strong>PIECE:</strong> Individual single kitchen item (e.g., 1 plate, 1 cup, or 1 pot).</li>
                    <li><strong>PAIR:</strong> 2 matching pieces (e.g., 1 pair of salt & pepper shakers or matching serving pair).</li>
                    <li><strong>SET:</strong> Complete matching bundle or service group (e.g., 6-piece dinner set or cookware set).</li>
                  </ul>
                  <p className="text-[11px] font-semibold text-emerald-800 pt-1">
                    ⚠️ <strong>Rule:</strong> Items included in a selected SET should not also be selected individually.
                  </p>
                </div>

                {/* Catalogue Loading / Error / Empty States */}
                {isDishwashingLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                    ))}
                  </div>
                ) : isDishwashingError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>
                      Failed to load dishwashing items: {(dishwashingFetchError as any)?.message || 'Server error'}. Please refresh or try again.
                    </span>
                  </div>
                ) : dishwashingCatalogue.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                    No active dishwashing items available in catalogue currently.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dishwashingCatalogue.map((item) => {
                      const qty = selectedDishwashingQuantities[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            qty > 0 ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{item.name}</span>
                              <Badge variant="info" size="sm">
                                {item.unit}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                              {item.description}
                            </p>
                            <p className="text-xs font-extrabold text-emerald-700 pt-0.5">
                              {formatNaira(item.price)} <span className="text-[10px] font-normal text-slate-400">/ {item.unit.toLowerCase()}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDishwashingQuantityChange(item.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold text-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDishwashingQuantityChange(item.id, 1)}
                              disabled={qty >= 1000}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Step 5: Schedule & Address */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  5
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Schedule & Address</h3>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Saved Property Address
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setIsAuthModalOpen(true);
                      } else {
                        setIsPropertyManagerOpen(true);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Manage Properties</span>
                  </button>
                </div>

                {savedProperties.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>No saved property found. Click to add your address.</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) setIsAuthModalOpen(true);
                        else setIsPropertyManagerOpen(true);
                      }}
                    >
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedProperties.map((prop) => {
                      const isSelected = selectedPropertyId === prop.id;
                      return (
                        <button
                          key={prop.id}
                          type="button"
                          onClick={() => handleSelectSavedProperty(prop)}
                          className={`p-3.5 text-left rounded-xl border transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs font-semibold'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">{prop.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {prop.addressLine1}, {prop.city}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Preferred Scheduled Date & Time"
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <Input
                  label="Cleaning Agent Instructions / Notes"
                  placeholder="e.g. Key is with security guard..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                />
              </div>
            </Card>
          </div>

          {/* Right Panel: Live Quote Summary */}
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 border-emerald-500/30 shadow-md sticky top-24 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Live Server Quote
                </h3>
                {isCalculating && (
                  <span className="text-[10px] text-emerald-600 animate-pulse font-semibold">
                    Calculating...
                  </span>
                )}
              </div>

              {isCalculating ? (
                <div className="h-28 bg-slate-100 rounded-xl animate-pulse my-3" />
              ) : quoteError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1 my-3">
                  <div className="flex items-center gap-2 font-bold text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Quote Unavailable</span>
                  </div>
                  <p className="text-[11px] text-red-600 leading-relaxed">{quoteError}</p>
                </div>
              ) : quoteSnapshot ? (
                <div className="space-y-2.5 py-3 text-xs">
                  <div className="flex justify-between text-slate-600 font-semibold border-b border-slate-100 pb-2">
                    <span>Base Cleaning ({quoteSnapshot.serviceName || 'Standard'})</span>
                    <span className="text-slate-900">
                      {formatNaira(quoteSnapshot.basePrice || quoteSnapshot.minimumPrice || 0)}
                    </span>
                  </div>

                  {quoteSnapshot.roomCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Room Charges ({numberOfBedrooms} beds + {numberOfLivingRooms} parlours = {totalRoomsCount} rooms)
                      </span>
                      <span>+{formatNaira(quoteSnapshot.roomCharges)}</span>
                    </div>
                  )}
                  {quoteSnapshot.bathroomCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Bathroom Charges ({numberOfBathrooms} baths)</span>
                      <span>+{formatNaira(quoteSnapshot.bathroomCharges)}</span>
                    </div>
                  )}
                  {quoteSnapshot.floorCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Floor Charges ({numberOfFloors} floors)</span>
                      <span>+{formatNaira(quoteSnapshot.floorCharges)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.sqMeterCharges && quoteSnapshot.sqMeterCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Area Charges</span>
                      <span>+{formatNaira(quoteSnapshot.sqMeterCharges)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.minimumAdjustment && quoteSnapshot.minimumAdjustment > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Minimum Price Adjustment</span>
                      <span>+{formatNaira(quoteSnapshot.minimumAdjustment)}</span>
                    </div>
                  )}

                  {/* Itemized Dishwashing Breakdown */}
                  {quoteSnapshot.dishwashingItems && quoteSnapshot.dishwashingItems.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 my-1">
                      <p className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                        <span>Dishwashing Items:</span>
                        <span className="text-emerald-700 font-extrabold">
                          +{formatNaira(quoteSnapshot.dishwashingTotal || 0)}
                        </span>
                      </p>
                      <div className="space-y-1 text-[11px] text-slate-600">
                        {quoteSnapshot.dishwashingItems.map((item, idx) => (
                          <div key={item.itemId || idx} className="flex justify-between">
                            <span>
                              • {item.itemName || item.name || `Item #${item.itemId}`} x{item.quantity} ({item.unit || 'PIECE'})
                            </span>
                            <span>{formatNaira(item.total || item.price || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {quoteSnapshot.addonsTotal > 0 && (
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Add-ons Total</span>
                      <span>+{formatNaira(quoteSnapshot.addonsTotal)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.furnishingSurcharge && quoteSnapshot.furnishingSurcharge !== 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>Property Condition Surcharge ({furnishingState})</span>
                      <span>+{formatNaira(quoteSnapshot.furnishingSurcharge)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.suppliesDiscount && quoteSnapshot.suppliesDiscount !== 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Customer Supplies Discount</span>
                      <span>{formatNaira(quoteSnapshot.suppliesDiscount)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.frequencyDiscount && quoteSnapshot.frequencyDiscount !== 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Frequency Discount ({frequency})</span>
                      <span>{formatNaira(quoteSnapshot.frequencyDiscount)}</span>
                    </div>
                  )}
                  {quoteSnapshot.serviceFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Service Fee</span>
                      <span>+{formatNaira(quoteSnapshot.serviceFee)}</span>
                    </div>
                  )}

                  {/* Duration & Recommended Cleaners Estimate */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    {quoteSnapshot.estimatedDurationMinutes ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Est. {Math.round(quoteSnapshot.estimatedDurationMinutes / 60 * 10) / 10} hrs</span>
                      </span>
                    ) : null}
                    {quoteSnapshot.recommendedCleaners ? (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Est. {quoteSnapshot.recommendedCleaners} Cleaners</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Total Price</span>
                    <span className="text-2xl font-black text-emerald-700 font-display">
                      {formatNaira(quoteSnapshot.total)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Select parameters to view price preview
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold text-xs sm:text-sm"
                isLoading={isBookingLoading}
                disabled={isBookingLoading || isCalculating || !!quoteError}
                onClick={handleBookNow}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Book & Proceed to Checkout
              </Button>

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Money Back Quality Guarantee</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Price Change Acceptance Modal */}
      <PriceChangeAcceptanceModal
        isOpen={!!pendingBooking}
        quotedTotal={quoteSnapshot?.total || 0}
        serverTotal={pendingBooking?.serverTotal || 0}
        onAccept={handleAcceptPriceChange}
        onDecline={() => setPendingBooking(null)}
      />

      {/* Property Manager Modal */}
      <PropertyManagerModal
        isOpen={isPropertyManagerOpen}
        onClose={() => {
          setIsPropertyManagerOpen(false);
          refetchProperties();
        }}
      />

      {/* Auth Modals */}
      <AuthModals
        isOpen={isAuthModalOpen}
        mode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={() => {}}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          addToast('success', 'Cleaning service payment verified! Order confirmed.');
          setTimeout(() => {
            navigate('/dashboard?tab=bookings');
          }, 1200);
        }}
        onCancel={() => {
          addToast('info', 'Payment checkout paused. You can complete payment anytime in My Bookings.');
        }}
      />
    </CustomerLayout>
  );
};
