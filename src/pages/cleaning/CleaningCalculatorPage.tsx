import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cleaningCustomerApi, SavedProperty } from '../../api/cleaningCustomer';
import {
  PriceSnapshot,
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
  PackageCheck,
  Bed,
  Tv,
  Utensils,
} from 'lucide-react';

export const CleaningCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const isTestMode = import.meta.env.MODE === 'test';

  // Wizard Step State (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

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
  const [roomConfigurationConfirmed, setRoomConfigurationConfirmed] = useState(false);

  // Optional Area
  const [dontKnowArea, setDontKnowArea] = useState<boolean>(true);
  const [squareMetersInput, setSquareMetersInput] = useState<string>('100');

  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [selectedDishwashingQuantities, setSelectedDishwashingQuantities] = useState<Record<number, number>>({});

  // Job preparation preference; it does not affect the price.
  const [suppliesPreference, setSuppliesPreference] = useState<SuppliesPreference>('SUPPLIES_INCLUDED');
  const [selectedFrequency, setSelectedFrequency] = useState<CleaningFrequency>('ONE_TIME');

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
  const [quoteRequiresAssessment, setQuoteRequiresAssessment] = useState(false);
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Out-of-order response protection ref
  const quoteRequestIdRef = useRef<number>(0);
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const frequencyPromotionsEnabled = selectedService?.frequencyPromotionsEnabled === true;
  const assessmentRequired = Boolean(selectedService?.requiresAssessment || quoteRequiresAssessment);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
    setRoomConfigurationConfirmed(true);
  };

  const handleDishwashingQuantityChange = (itemId: number, delta: number) => {
    setSelectedDishwashingQuantities((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.min(1000, Math.max(0, current + delta));
      return { ...prev, [itemId]: updated };
    });
  };

  const getDishwashingPayload = () => {
    return Object.entries(selectedDishwashingQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemIdStr, quantity] ) => ({
        itemId: parseInt(itemIdStr, 10),
        quantity: Math.min(1000, Math.max(1, quantity)),
      }))
      .slice(0, 50);
  };

  useEffect(() => {
    const currentRequestId = ++quoteRequestIdRef.current;

    if (!selectedServiceId || !selectedPropertyTypeId || !roomConfigurationConfirmed) {
      setQuoteSnapshot(null);
      setQuoteError(null);
      setQuoteRequiresAssessment(false);
      setIsCalculating(false);
      return;
    }

    if (selectedService?.requiresAssessment) {
      setQuoteSnapshot(null);
      setQuoteError(null);
      setQuoteRequiresAssessment(false);
      setIsCalculating(false);
      return;
    }

    setQuoteSnapshot(null);
    setIsCalculating(true);
    setQuoteError(null);
    setQuoteRequiresAssessment(false);

    const calculate = async () => {
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
          suppliesPreference,
          ...(frequencyPromotionsEnabled ? { frequency: selectedFrequency } : {}),
          addons: addonPayload,
          dishwashingItems: dishwashingItemsPayload,
        });

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
          setQuoteRequiresAssessment(err.response?.data?.code === 'ASSESSMENT_REQUIRED');
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
    roomConfigurationConfirmed,
    numberOfBedrooms,
    numberOfLivingRooms,
    numberOfBathrooms,
    numberOfFloors,
    dontKnowArea,
    squareMetersInput,
    suppliesPreference,
    selectedFrequency,
    frequencyPromotionsEnabled,
    selectedService?.requiresAssessment,
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

    if (!selectedPropertyTypeId || !roomConfigurationConfirmed) {
      addToast('error', 'Please select a property type and confirm the room counts.');
      return;
    }

    if (!quoteSnapshot) {
      addToast('error', 'Please wait for a valid cleaning quote before booking.');
      return;
    }

    if (isBookingLoading || isCalculating || !!quoteError) return;

    setIsBookingLoading(true);

    try {
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

      const addonPayload = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, quantity]) => ({ addonId: parseInt(addonId, 10), quantity }));

      const dishwashingPayload = getDishwashingPayload();

      const booking = await cleaningCustomerApi.createBooking({
        propertyId: selectedPropertyId,
        serviceId: selectedServiceId,
        scheduledAt,
        suppliesPreference,
        ...(frequencyPromotionsEnabled ? { frequency: selectedFrequency } : {}),
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
      const isAssessmentRequired = err.response?.data?.code === 'ASSESSMENT_REQUIRED';
      addToast(
        'error',
        isAssessmentRequired
          ? 'This cleaning request needs a manual assessment before a price can be confirmed. Please contact support.'
          : err.response?.data?.message || err.message || 'Cleaning booking failed.'
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

  const totalRoomsCount = numberOfBedrooms + numberOfLivingRooms;
  const cleaningSubtotalBeforeMinimum =
    quoteSnapshot
      ? quoteSnapshot.basePrice +
        quoteSnapshot.roomCharges +
        quoteSnapshot.bathroomCharges +
        quoteSnapshot.floorCharges +
        quoteSnapshot.sqMeterCharges
      : 0;
  const cleaningSubtotalAfterMinimum =
    cleaningSubtotalBeforeMinimum + (quoteSnapshot?.minimumAdjustment || 0);

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedServiceId) {
      addToast('error', 'Please select a cleaning service to continue.');
      return;
    }
    if (currentStep === 2 && !selectedPropertyTypeId) {
      addToast('error', 'Please select a property type.');
      return;
    }
    if (currentStep === 2 && !roomConfigurationConfirmed) {
      addToast('error', 'Please review and confirm the room counts before continuing.');
      return;
    }
    if (currentStep === 5 && !selectedPropertyId) {
      addToast('error', 'Please select or add a saved property address to continue.');
      setIsPropertyManagerOpen(true);
      return;
    }
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

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
              Get a live price based on your selected service, property, room breakdown, and any extras you choose.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/60 text-xs space-y-2 max-w-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Satisfaction Guarantee</span>
            </div>
            <p className="text-slate-300">
              Vetted, background-checked cleaning field agents and live job tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        {/* Top Wizard Stepper Indicator */}
        {!isTestMode && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
              {[
                { step: 1, title: 'Service' },
                { step: 2, title: 'Property & Rooms' },
                { step: 3, title: 'Preparation' },
                { step: 4, title: 'Add-ons & Extras' },
                { step: 5, title: 'Schedule & Book' },
              ].map((item) => {
                const isCompleted = currentStep > item.step;
                const isActive = currentStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      if (item.step < currentStep) {
                        setCurrentStep(item.step);
                      } else if (item.step === 2 && selectedServiceId) {
                        setCurrentStep(2);
                      } else if (item.step === 3 && selectedPropertyTypeId) {
                        setCurrentStep(3);
                      } else if (item.step <= currentStep) {
                        setCurrentStep(item.step);
                      }
                    }}
                    className={`flex items-center gap-3 text-left transition-all ${
                      isActive ? 'opacity-100 scale-102' : isCompleted ? 'opacity-90 cursor-pointer' : 'opacity-60'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Step {item.step}</p>
                      <p className={`text-xs font-bold ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>{item.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: Cleaning Service */}
            {(isTestMode || currentStep === 1) && (
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
                        onClick={() => {
                          setSelectedServiceId(svc.id);
                          setSelectedFrequency('ONE_TIME');
                        }}
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
                          {svc.description || 'Professional cleaning for your home.'}
                        </p>
                        <span className="inline-block mt-3 text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-2.5 py-1 rounded-md">
                          Est. {svc.estimatedDurationMinutes || 120} mins
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* STEP 2: Property Type & Room-Based Layout */}
            {(isTestMode || currentStep === 2) && (
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

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600 leading-relaxed mt-3 sm:mt-4">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Room-Based Pricing Note:</strong> A main sitting room, separate lounge, or children's parlour each counts as a living room. Bedrooms and living rooms share the same room rate.
                  </span>
                </div>

                {isLegacyProperty && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Selected property has a legacy room total ({legacyRoomTotal} rooms). Please specify the breakdown below.
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
                        <Tv className="w-4 h-4 text-emerald-600" /> Living Rooms
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

                <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
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
                </div>

                <div className="pt-1">
                  <p className="text-xs text-slate-600 mb-3">
                    Review the counts above. We will not show a price until you confirm this property setup.
                  </p>
                  <Button
                    type="button"
                    variant={roomConfigurationConfirmed ? 'outline' : 'primary'}
                    size="md"
                    disabled={!selectedPropertyTypeId}
                    onClick={() => setRoomConfigurationConfirmed(true)}
                  >
                    {roomConfigurationConfirmed ? 'Room counts confirmed' : 'Use these room counts'}
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3: Supplies & Preparation */}
            {(isTestMode || currentStep === 3) && (
              <Card className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                    3
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Preparation & frequency</h3>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" /> Cleaning Supplies
                  </label>
                  <p className="text-xs leading-relaxed text-slate-500">
                    This preference is shared for job preparation and does not change the price.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'SUPPLIES_INCLUDED' as const, label: 'Cleaning team brings supplies', desc: 'The team should bring the cleaning supplies.' },
                      { id: 'CUSTOMER_PROVIDED' as const, label: 'I will provide supplies', desc: 'The team should use supplies available at the property.' },
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

                {frequencyPromotionsEnabled && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Service frequency
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'ONE_TIME' as const, label: 'One-time', discount: 0 },
                        { id: 'WEEKLY' as const, label: 'Weekly', discount: selectedService?.weeklyDiscountPercent || 0 },
                        { id: 'BI_WEEKLY' as const, label: 'Every 2 weeks', discount: selectedService?.biWeeklyDiscountPercent || 0 },
                        { id: 'MONTHLY' as const, label: 'Monthly', discount: selectedService?.monthlyDiscountPercent || 0 },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedFrequency(option.id)}
                          className={`p-3.5 text-left rounded-xl border text-xs transition-all ${
                            selectedFrequency === option.id
                              ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span className="block font-bold">{option.label}</span>
                          <span className="block mt-1 text-[10px] text-slate-500">
                            {option.discount > 0 ? `Save ${option.discount}% on cleaning` : 'Standard rate'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 4: Add-Ons & Dishwashing Catalogue */}
            {(isTestMode || currentStep === 4) && (
              <Card className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                    4
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Select Add-On Services & Dishwashing</h3>
                </div>

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

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" /> Dishwashing Catalogue
                    </label>
                    <Badge variant="success" size="sm">
                      Live Active Items
                    </Badge>
                  </div>

                  {isDishwashingLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
                      ))}
                    </div>
                  ) : dishwashingCatalogue.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      No active dishwashing items available.
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
                                <Badge variant="info" size="sm">{item.unit}</Badge>
                              </div>
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
            )}

            {/* STEP 5: Schedule & Address */}
            {(isTestMode || currentStep === 5) && (
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
                        if (!isAuthenticated) setIsAuthModalOpen(true);
                        else setIsPropertyManagerOpen(true);
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
            )}

            {/* Wizard Navigation Buttons */}
            {!isTestMode && (
              <div className="flex items-center justify-between pt-4">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" size="md" onClick={handlePrevStep}>
                    ← Back
                  </Button>
                ) : <div />}

                {currentStep < 5 ? (
                  <Button type="button" variant="primary" size="md" onClick={handleNextStep}>
                    Continue to Step {currentStep + 1} →
                  </Button>
                ) : <div />}
              </div>
            )}
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
              ) : assessmentRequired ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2 my-3">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Assessment required</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This service needs a manual assessment before we can confirm a price. It cannot be quoted or booked online yet.
                  </p>
                  <a
                    className="inline-flex font-semibold text-emerald-800 underline underline-offset-2"
                    href={`mailto:support@lofix.ng?subject=${encodeURIComponent(`Cleaning assessment: ${selectedService?.name || 'Cleaning service'}`)}`}
                  >
                    Contact Lofix support
                  </a>
                </div>
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
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    The quote shows the starting price, room-based charges, any minimum-price adjustment, optional extras, discounts, and the fixed service fee.
                  </p>
                  <div className="flex justify-between text-slate-600 font-semibold border-b border-slate-100 pb-2">
                    <span>Base cleaning price ({quoteSnapshot.serviceName || 'Standard'})</span>
                    <span className="text-slate-900">
                      {formatNaira(quoteSnapshot.basePrice)}
                    </span>
                  </div>

                  {quoteSnapshot.pricePerRoom !== undefined ? (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Room charges ({numberOfBedrooms} bedrooms + {numberOfLivingRooms} living rooms = {totalRoomsCount} rooms × {formatNaira(quoteSnapshot.pricePerRoom)} per room)
                      </span>
                      <span>+{formatNaira(quoteSnapshot.roomCharges)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Room charges ({numberOfBedrooms} bedrooms + {numberOfLivingRooms} living rooms = {totalRoomsCount} rooms)</span>
                      <span>+{formatNaira(quoteSnapshot.roomCharges)}</span>
                    </div>
                  )}
                  {quoteSnapshot.pricePerBathroom !== undefined ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Bathroom charges ({numberOfBathrooms} × {formatNaira(quoteSnapshot.pricePerBathroom)} per bathroom)</span>
                      <span>+{formatNaira(quoteSnapshot.bathroomCharges)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Bathroom charges ({numberOfBathrooms} bathrooms)</span>
                      <span>+{formatNaira(quoteSnapshot.bathroomCharges)}</span>
                    </div>
                  )}
                  {quoteSnapshot.pricePerFloor !== undefined ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Floor charges ({numberOfFloors} × {formatNaira(quoteSnapshot.pricePerFloor)} per floor)</span>
                      <span>+{formatNaira(quoteSnapshot.floorCharges)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Floor charges ({numberOfFloors} floors)</span>
                      <span>+{formatNaira(quoteSnapshot.floorCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-700">
                    <span>Cleaning subtotal before minimum price</span>
                    <span>{formatNaira(cleaningSubtotalBeforeMinimum)}</span>
                  </div>
                  {quoteSnapshot.minimumPrice !== undefined && quoteSnapshot.minimumPrice > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Minimum cleaning price</span>
                      <span>{formatNaira(quoteSnapshot.minimumPrice)}</span>
                    </div>
                  )}
                  {(quoteSnapshot.minimumAdjustment || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Minimum-price adjustment</span>
                      <span>+{formatNaira(quoteSnapshot.minimumAdjustment || 0)}</span>
                    </div>
                  )}
                  {quoteSnapshot.minimumPrice !== undefined && (
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Cleaning subtotal after minimum price</span>
                      <span>{formatNaira(cleaningSubtotalAfterMinimum)}</span>
                    </div>
                  )}
                  {quoteSnapshot.addons?.length ? quoteSnapshot.addons.map((addon) => {
                    const unitPrice = addon.unitPrice ?? addon.price;
                    const total = addon.total ?? (unitPrice !== undefined ? unitPrice * addon.quantity : undefined);
                    return (
                      <div key={addon.addonId} className="flex justify-between text-slate-600">
                        <span>
                          {addon.name || addon.addonName || 'Add-on'}
                          {unitPrice !== undefined ? ` (${addon.quantity} × ${formatNaira(unitPrice)})` : ` (${addon.quantity})`}
                        </span>
                        <span>+{formatNaira(total ?? 0)}</span>
                      </div>
                    );
                  }) : quoteSnapshot.addonsTotal > 0 ? (
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Add-ons</span>
                      <span>+{formatNaira(quoteSnapshot.addonsTotal)}</span>
                    </div>
                  ) : null}
                  {quoteSnapshot.dishwashingItems?.length ? quoteSnapshot.dishwashingItems.map((item) => {
                    const unitPrice = item.unitPriceKobo ?? item.unitPrice ?? item.price;
                    const total = item.total ?? (unitPrice !== undefined ? unitPrice * item.quantity : undefined);
                    return (
                      <div key={item.itemId} className="flex justify-between text-slate-600">
                        <span>
                          {item.name || item.itemName || 'Dishwashing'}
                          {unitPrice !== undefined ? ` (${item.quantity} × ${formatNaira(unitPrice)})` : ` (${item.quantity})`}
                        </span>
                        <span>+{formatNaira(total ?? 0)}</span>
                      </div>
                    );
                  }) : (quoteSnapshot.dishwashingTotal || 0) > 0 ? (
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Dishwashing</span>
                      <span>+{formatNaira(quoteSnapshot.dishwashingTotal || 0)}</span>
                    </div>
                  ) : null}
                  {(quoteSnapshot.furnishingSurcharge || 0) !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Furnishing adjustment</span>
                      <span>{formatNaira(quoteSnapshot.furnishingSurcharge || 0)}</span>
                    </div>
                  )}
                  {(quoteSnapshot.suppliesDiscount || 0) !== 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Supplies discount</span>
                      <span>{formatNaira(quoteSnapshot.suppliesDiscount || 0)}</span>
                    </div>
                  )}
                  {!!quoteSnapshot.frequencyDiscount && quoteSnapshot.frequencyDiscount !== 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>
                        Frequency discount{quoteSnapshot.frequencyDiscountPercent
                          ? ` (${quoteSnapshot.frequencyDiscountPercent}%)`
                          : ''}
                      </span>
                      <span>{formatNaira(quoteSnapshot.frequencyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Service fee (fixed)</span>
                    <span>
                      {quoteSnapshot.serviceFee > 0 ? '+' : ''}
                      {formatNaira(quoteSnapshot.serviceFee)}
                    </span>
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
                  Choose a cleaning service and property type, review the room counts, then select “Use these room counts” to see your price.
                </div>
              )}

              {!isTestMode && currentStep < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full font-bold text-xs sm:text-sm"
                  onClick={handleNextStep}
                >
                  Continue to Next Step →
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full font-bold text-xs sm:text-sm"
                  isLoading={isBookingLoading}
                  disabled={isBookingLoading || isCalculating || !!quoteError || assessmentRequired || !quoteSnapshot}
                  onClick={handleBookNow}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Book & Proceed to Checkout
                </Button>
              )}

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Money Back Quality Guarantee</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      <PriceChangeAcceptanceModal
        isOpen={!!pendingBooking}
        quotedTotal={quoteSnapshot?.total || 0}
        serverTotal={pendingBooking?.serverTotal || 0}
        onAccept={handleAcceptPriceChange}
        onDecline={() => setPendingBooking(null)}
      />

      <PropertyManagerModal
        isOpen={isPropertyManagerOpen}
        onClose={() => {
          setIsPropertyManagerOpen(false);
          refetchProperties();
        }}
      />

      <AuthModals
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
      />

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
