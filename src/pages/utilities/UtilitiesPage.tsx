import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  utilitiesApi,
  UtilityCategory,
  VtpassVerifyResult,
  VtpassOrderResult,
} from '../../api/utilities';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { formatNaira } from '../../utils/money';
import { useAuth } from '../../context/AuthContext';
import { PlanSelectorModal } from '../../components/utilities/PlanSelectorModal';
import { PaymentModal } from '../../components/payment/PaymentModal';
import {
  Zap,
  Wifi,
  Smartphone,
  Tv,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles,
  CreditCard,
  AlertCircle,
  MapPin,
  Info,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const UtilitiesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = (location.state as any) || {};

  const [activeCategory, setActiveCategory] = useState<UtilityCategory>(
    incomingState.category || 'ELECTRICITY'
  );

  // Fetch Server-Authoritative Electricity Catalogue: GET /bills/vtpass/electricity/catalogue (Cached 5 mins, 3 retries for transient/5xx, stop on 429)
  const {
    data: electricityCatalogue,
    isLoading: isCatalogueLoading,
    isError: isCatalogueError,
    error: catalogueError,
    refetch: refetchCatalogue,
  } = useQuery({
    queryKey: ['electricityCatalogue'],
    queryFn: () => utilitiesApi.getElectricityCatalogue(),
    enabled: activeCategory === 'ELECTRICITY',
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (import.meta.env.MODE === 'test') return false;
      if (error?.response?.status === 429) return false;
      if (failureCount >= 3) return false;
      const status = error?.response?.status;
      return !status || status >= 500;
    },
    retryDelay: (failureCount) => (import.meta.env.MODE === 'test' ? 0 : Math.pow(2, failureCount) * 1000),
  });

  // State-First Selection for Electricity
  const [selectedStateCode, setSelectedStateCode] = useState<string>('LA'); // Default to Lagos
  const [selectedServiceID, setSelectedServiceID] = useState<string>(incomingState.serviceID || '');

  const currentState = electricityCatalogue?.states?.find((s) => s.code === selectedStateCode);
  const mappedProvidersForState =
    electricityCatalogue?.providers?.filter((p) =>
      currentState?.providerIds?.includes(p.serviceID)
    ) || [];

  // Reset selectedServiceID or require explicit user selection when state changes
  useEffect(() => {
    if (activeCategory === 'ELECTRICITY' && !incomingState.serviceID) {
      setSelectedServiceID('');
      setElectricityVerification(null);
    }
  }, [selectedStateCode, activeCategory]);

  // Automatically select the correct state for the passed serviceID from Buy Again
  useEffect(() => {
    if (incomingState.serviceID && electricityCatalogue?.states) {
      const match = electricityCatalogue.states.find((s) =>
        s.providerIds.includes(incomingState.serviceID)
      );
      if (match) {
        setSelectedStateCode(match.code);
      }
    }
  }, [incomingState.serviceID, electricityCatalogue]);

  // Fetch Services for Non-Electricity Categories (DATA, AIRTIME, CABLE): GET /bills/vtpass/services/{type}
  const {
    data: services = [],
    isLoading: isServicesLoading,
    isError: isServicesError,
    error: servicesError,
  } = useQuery({
    queryKey: ['vtpassServices', activeCategory],
    queryFn: () => utilitiesApi.getVtpassServices(activeCategory),
    enabled: activeCategory !== 'ELECTRICITY',
  });

  useEffect(() => {
    if (activeCategory !== 'ELECTRICITY' && services.length > 0 && !incomingState.serviceID) {
      setSelectedServiceID(services[0].serviceID);
    }
  }, [services, activeCategory]);

  // Fetch Variations for DATA / CABLE: GET /bills/vtpass/variations/{type}/{serviceID}
  const isVariationCategory = activeCategory === 'DATA' || activeCategory === 'CABLE';

  const {
    data: variations = [],
    isLoading: isVariationsLoading,
    isError: isVariationsError,
  } = useQuery({
    queryKey: ['vtpassVariations', activeCategory, selectedServiceID],
    queryFn: () =>
      utilitiesApi.getVtpassVariations(
        activeCategory as 'DATA' | 'CABLE',
        selectedServiceID
      ),
    enabled: isVariationCategory && !!selectedServiceID,
  });

  const [selectedVariationCode, setSelectedVariationCode] = useState<string>('');

  useEffect(() => {
    if (variations.length > 0 && !selectedVariationCode) {
      setSelectedVariationCode(variations[0].variation_code);
    }
  }, [variations]);

  // Airtime Form State
  const [airtimePhone, setAirtimePhone] = useState<string>(
    incomingState.category === 'AIRTIME' ? incomingState.target || '' : ''
  );
  const [airtimeAmountNaira, setAirtimeAmountNaira] = useState<number>(
    incomingState.amountNaira || 1000
  );

  // Data Form State
  const [dataPhone, setDataPhone] = useState<string>(
    incomingState.category === 'DATA' ? incomingState.target || '' : ''
  );
  const [dataContactPhone, setDataContactPhone] = useState<string>('');

  // Cable TV Form State
  const [cableSmartcard, setCableSmartcard] = useState<string>(
    incomingState.category === 'CABLE' ? incomingState.target || '' : ''
  );
  const [cableContactPhone, setCableContactPhone] = useState<string>('');
  const [subscriptionType, setSubscriptionType] = useState<'change' | 'renew'>('change');
  const [cableVerification, setCableVerification] = useState<VtpassVerifyResult | null>(null);
  const [isVerifyingCable, setIsVerifyingCable] = useState(false);

  // Electricity Form State
  const [meterNumber, setMeterNumber] = useState<string>(
    incomingState.category === 'ELECTRICITY' ? incomingState.target || '' : ''
  );
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [electricityContactPhone, setElectricityContactPhone] = useState<string>('');
  const [electricityAmountNaira, setElectricityAmountNaira] = useState<number>(
    incomingState.amountNaira || 5000
  );
  const [electricityVerification, setElectricityVerification] = useState<VtpassVerifyResult | null>(null);
  const [isVerifyingElectricity, setIsVerifyingElectricity] = useState(false);

  // Plan Selector Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Verification Caching (Once-Only Verification)
  const getVerificationCacheKey = (svcId: string, tgt: string) => `lofix_verify_${svcId}_${tgt}`;

  useEffect(() => {
    if (activeCategory === 'ELECTRICITY' && selectedServiceID && meterNumber.trim()) {
      const cached = sessionStorage.getItem(getVerificationCacheKey(selectedServiceID, meterNumber.trim()));
      if (cached) {
        try {
          setElectricityVerification(JSON.parse(cached));
        } catch {
          // Ignore
        }
      }
    }
  }, [selectedServiceID, meterNumber, activeCategory]);

  // Out-of-order verification ref protection
  const verifyRequestIdRef = useRef<number>(0);

  // Idempotency Key Ref (reused if parameters haven't changed; regenerated on change)
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const lastPayloadSignatureRef = useRef<string>('');

  // Two-Step Order & Payment State
  const [isReviewingOrder, setIsReviewingOrder] = useState(false);
  const [orderPreview, setOrderPreview] = useState<VtpassOrderResult | null>(null);
  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);

  // Modals & Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Invalidate Electricity Verification whenever state, provider, meter type, or meter number changes (unless cached)
  useEffect(() => {
    if (selectedServiceID && meterNumber.trim()) {
      const cached = sessionStorage.getItem(getVerificationCacheKey(selectedServiceID, meterNumber.trim()));
      if (!cached) {
        setElectricityVerification(null);
      }
    } else {
      setElectricityVerification(null);
    }
  }, [selectedStateCode, selectedServiceID, meterType, meterNumber]);

  // Invalidate Cable Verification whenever provider or smartcard changes
  useEffect(() => {
    setCableVerification(null);
  }, [selectedServiceID, cableSmartcard]);

  // Target Verification: Electricity
  const handleVerifyElectricity = async () => {
    if (!selectedServiceID) {
      addToast('error', 'Please select an electricity distribution company (DisCo).');
      return;
    }

    const providerObj = electricityCatalogue?.providers?.find((p) => p.serviceID === selectedServiceID);
    if (providerObj && providerObj.available === false) {
      addToast('error', providerObj.unavailableReason || 'This DisCo is currently unavailable for online purchase.');
      return;
    }

    if (!meterNumber.trim() || meterNumber.length < 6) {
      addToast('error', 'Please enter a valid meter number.');
      return;
    }

    const currentVerifyId = ++verifyRequestIdRef.current;
    setIsVerifyingElectricity(true);

    try {
      const res = await utilitiesApi.verifyVtpassTarget({
        serviceID: selectedServiceID,
        target: meterNumber.trim(),
        meterType,
      });

      if (currentVerifyId === verifyRequestIdRef.current) {
        setElectricityVerification(res);
        sessionStorage.setItem(
          getVerificationCacheKey(selectedServiceID, meterNumber.trim()),
          JSON.stringify(res)
        );
        addToast('success', `Meter verified! Customer: ${res.customerName}`);
      }
    } catch (err: any) {
      if (currentVerifyId === verifyRequestIdRef.current) {
        setElectricityVerification(null);
        const serverDetail = err.response?.data?.message || err.message || 'Meter verification failed.';
        addToast('error', serverDetail);
      }
    } finally {
      if (currentVerifyId === verifyRequestIdRef.current) {
        setIsVerifyingElectricity(false);
      }
    }
  };

  // Target Verification: Cable TV
  const handleVerifyCable = async () => {
    if (!selectedServiceID) {
      addToast('error', 'Please select a Cable TV provider.');
      return;
    }
    if (!cableSmartcard.trim() || cableSmartcard.length < 6) {
      addToast('error', 'Please enter a valid Smartcard / IUC number.');
      return;
    }

    const currentVerifyId = ++verifyRequestIdRef.current;
    setIsVerifyingCable(true);

    try {
      const res = await utilitiesApi.verifyVtpassTarget({
        serviceID: selectedServiceID,
        target: cableSmartcard.trim(),
      });

      if (currentVerifyId === verifyRequestIdRef.current) {
        setCableVerification(res);
        addToast('success', `Smartcard verified! Customer: ${res.customerName}`);
      }
    } catch (err: any) {
      if (currentVerifyId === verifyRequestIdRef.current) {
        setCableVerification(null);
        const serverDetail = err.response?.data?.message || err.message || 'Smartcard verification failed.';
        addToast('error', serverDetail);
      }
    } finally {
      if (currentVerifyId === verifyRequestIdRef.current) {
        setIsVerifyingCable(false);
      }
    }
  };

  const handleReviewOrder = async () => {
    if (!isAuthenticated) {
      addToast('error', 'Please sign in to proceed with utilities payment.');
      return;
    }

    if (!selectedServiceID) {
      addToast('error', 'Please select a service provider.');
      return;
    }

    setIsReviewingOrder(true);

    try {
      let target = '';
      let phone = '';
      let amountKobo = 0;
      let variationCode = '';

      if (activeCategory === 'AIRTIME') {
        if (!airtimePhone.trim() || airtimePhone.length < 10) {
          addToast('error', 'Please enter a valid recipient phone number.');
          setIsReviewingOrder(false);
          return;
        }
        target = airtimePhone.trim();
        phone = airtimePhone.trim();
        amountKobo = airtimeAmountNaira * 100;
      } else if (activeCategory === 'DATA') {
        if (!dataPhone.trim() || dataPhone.length < 10) {
          addToast('error', 'Please enter a valid recipient phone number.');
          setIsReviewingOrder(false);
          return;
        }
        if (!selectedVariationCode) {
          addToast('error', 'Please select a data bundle plan.');
          setIsReviewingOrder(false);
          return;
        }
        target = dataPhone.trim();
        phone = dataContactPhone.trim() || dataPhone.trim();
        variationCode = selectedVariationCode;
      } else if (activeCategory === 'CABLE') {
        if (!cableSmartcard.trim()) {
          addToast('error', 'Please enter your Smartcard number.');
          setIsReviewingOrder(false);
          return;
        }
        if (!selectedVariationCode) {
          addToast('error', 'Please select a cable TV bouquet.');
          setIsReviewingOrder(false);
          return;
        }
        target = cableSmartcard.trim();
        phone = cableContactPhone.trim();
        variationCode = selectedVariationCode;
      } else if (activeCategory === 'ELECTRICITY') {
        if (!meterNumber.trim()) {
          addToast('error', 'Please enter your meter number.');
          setIsReviewingOrder(false);
          return;
        }
        target = meterNumber.trim();
        phone = electricityContactPhone.trim();
        amountKobo = electricityAmountNaira * 100;
      }

      const currentSignature = `${activeCategory}-${selectedServiceID}-${target}-${meterType}-${variationCode}-${amountKobo}`;
      if (currentSignature !== lastPayloadSignatureRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
        lastPayloadSignatureRef.current = currentSignature;
      }

      const orderResult = await utilitiesApi.createVtpassOrder({
        idempotencyKey: idempotencyKeyRef.current,
        type: activeCategory,
        serviceID: selectedServiceID,
        target,
        meterType: activeCategory === 'ELECTRICITY' ? meterType : undefined,
        phone: phone || undefined,
        amount: amountKobo || undefined,
        variationCode: variationCode || undefined,
        subscriptionType: activeCategory === 'CABLE' ? subscriptionType : undefined,
      });

      setOrderPreview(orderResult);
      addToast('success', `Order #${orderResult.orderId} created successfully! Please review pricing.`);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Order creation failed.');
    } finally {
      setIsReviewingOrder(false);
    }
  };

  const selectedProviderObj = electricityCatalogue?.providers?.find(
    (p) => p.serviceID === selectedServiceID
  );

  const activeVariation = variations.find((v) => v.variation_code === selectedVariationCode);

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>VTpass Utility Payments ({electricityCatalogue?.environment || 'sandbox'})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              Buy Electricity, Data, Airtime & Cable TV
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Instant meter token generation, data recharges, airtime top-ups, and cable TV renewals powered by VTpass and Paystack NGN checkout.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2 max-w-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>National Discovery Coverage</span>
            </div>
            <p className="text-slate-300">
              State-first electricity DisCo mapping across all 36 states and FCT.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          {[
            { id: 'ELECTRICITY' as const, label: 'Electricity Tokens', icon: <Zap className="w-4 h-4" /> },
            { id: 'DATA' as const, label: 'Mobile Data', icon: <Wifi className="w-4 h-4" /> },
            { id: 'AIRTIME' as const, label: 'Airtime Top-Up', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'CABLE' as const, label: 'Cable TV Renewal', icon: <Tv className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                setOrderPreview(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* ELECTRICITY TAB */}
            {activeCategory === 'ELECTRICITY' && (
              <Card className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Buy Electricity Meter Token
                  </h3>
                  <Badge variant="success" size="sm">
                    State-First DisCo Discovery
                  </Badge>
                </div>

                {isCatalogueLoading ? (
                  <div className="h-64 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400">
                    <span>Loading national electricity catalogue...</span>
                  </div>
                ) : isCatalogueError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Failed to load electricity catalogue</span>
                    </div>
                    <p className="text-[11px] text-red-700">
                      {(catalogueError as any)?.message || 'Server error loading catalogue. Please try again.'}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetchCatalogue()}>
                      Retry Loading Catalogue
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-600" /> 1. Select State in Nigeria
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          36 States + FCT
                        </span>
                      </div>

                      <Select
                        value={selectedStateCode}
                        onChange={(e) => setSelectedStateCode(e.target.value)}
                        options={[
                          { value: '', label: 'Select your state in Nigeria...' },
                          ...(electricityCatalogue?.states || []).map((s) => ({
                            value: s.code,
                            label: `${s.name} (${s.providerIds.length} DisCo${s.providerIds.length > 1 ? 's' : ''})`,
                          })),
                        ]}
                      />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          2. Select Distribution Company (DisCo) for {currentState?.name || 'Selected State'}
                        </label>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          Explicit Selection Required
                        </span>
                      </div>

                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-950">
                          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Distribution Zone Match Guidance:</span>
                        </p>
                        <p>
                          {electricityCatalogue?.coverageNote ||
                            'State mapping is distribution-zone guidance, not a meter-level guarantee. Please match the distribution company shown on your physical electricity bill.'}
                        </p>
                      </div>

                      {!selectedStateCode ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                          Please select a state above to view available Distribution Companies (DisCos).
                        </div>
                      ) : mappedProvidersForState.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                          Electricity online purchase is not yet offered for this state.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {mappedProvidersForState.map((provider) => {
                            const isSelected = selectedServiceID === provider.serviceID;
                            const isAvailable = provider.available !== false;

                            return (
                              <button
                                key={provider.serviceID}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => {
                                  setSelectedServiceID(provider.serviceID);
                                  setElectricityVerification(null);
                                }}
                                className={`p-4 text-left rounded-2xl border-2 transition-all relative ${
                                  !isAvailable
                                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-75 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-emerald-600 bg-emerald-50/60 font-bold text-slate-900 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-xs text-slate-900">{provider.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{provider.serviceID}</p>
                                  </div>
                                  <Badge
                                    variant={isAvailable ? 'success' : 'neutral'}
                                    size="sm"
                                  >
                                    {isAvailable ? 'Available' : 'Unavailable'}
                                  </Badge>
                                </div>

                                {provider.coverageNote && (
                                  <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-tight">
                                    {provider.coverageNote}
                                  </p>
                                )}

                                {!isAvailable && provider.unavailableReason && (
                                  <div className="mt-2 text-[10px] text-red-600 font-semibold bg-red-50 p-1.5 rounded-md border border-red-100">
                                    {provider.unavailableReason}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          3. Meter Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'prepaid' as const, label: 'Prepaid Meter' },
                            { id: 'postpaid' as const, label: 'Postpaid Meter' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setMeterType(m.id);
                                setElectricityVerification(null);
                              }}
                              className={`p-3 text-center rounded-xl border text-xs font-bold transition-all ${
                                meterType === m.id
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          4. Meter Number
                        </label>
                        <Input
                          placeholder="Enter meter number..."
                          value={meterNumber}
                          onChange={(e) => setMeterNumber(e.target.value)}
                        />
                      </div>

                      {electricityVerification && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verified Customer Name: {electricityVerification.customerName}</span>
                          </div>
                          {electricityVerification.address && (
                            <p className="text-[11px] text-emerald-700">{electricityVerification.address}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <Input
                        label="5. Contact Phone Number"
                        placeholder="e.g. 08031234567"
                        value={electricityContactPhone}
                        onChange={(e) => setElectricityContactPhone(e.target.value)}
                        required
                      />

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          6. Electricity Purchase Amount (NGN)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setElectricityAmountNaira(amt)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                electricityAmountNaira === amt
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              ₦{amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          min="500"
                          step="500"
                          value={electricityAmountNaira}
                          onChange={(e) => setElectricityAmountNaira(parseInt(e.target.value, 10) || 500)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* NON-ELECTRICITY TABS (DATA, AIRTIME, CABLE) */}
            {activeCategory !== 'ELECTRICITY' && (
              <Card className="space-y-6">
                {isServicesLoading ? (
                  <div className="h-64 animate-pulse bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    <span>Loading VTpass services...</span>
                  </div>
                ) : isServicesError ? (
                  <div className="p-6 bg-red-50 border-red-200 text-xs text-red-900">
                    <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
                    <p className="font-bold">Failed to load services</p>
                    <p>{(servicesError as any)?.message || 'Server error loading VTpass services.'}</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active service providers found for this category.
                  </div>
                ) : (
                  <>
                    {/* MOBILE DATA TAB */}
                    {activeCategory === 'DATA' && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-emerald-600" />
                            Buy Mobile Data Bundles
                          </h3>
                          <Badge variant="info" size="sm">
                            VTpass Plans
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Network Operator
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {services.map((svc) => (
                              <button
                                key={svc.serviceID}
                                type="button"
                                onClick={() => setSelectedServiceID(svc.serviceID)}
                                className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                                  selectedServiceID === svc.serviceID
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {svc.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Recipient Phone Number"
                            placeholder="e.g. 08031234567"
                            value={dataPhone}
                            onChange={(e) => setDataPhone(e.target.value)}
                            required
                          />
                          <Input
                            label="Contact Phone Number"
                            placeholder="e.g. 08031234567"
                            value={dataContactPhone}
                            onChange={(e) => setDataContactPhone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Data Plan
                          </label>
                          {isVariationsLoading ? (
                            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                          ) : isVariationsError ? (
                            <p className="text-xs text-red-600">Failed to load data plans.</p>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsPlanModalOpen(true)}
                                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-between text-left transition-all shadow-2xs group"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selected Plan</span>
                                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                                    {activeVariation ? activeVariation.name : 'Choose data bundle plan...'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {activeVariation && (
                                    <span className="font-extrabold text-sm text-emerald-700">
                                      {formatNaira(parseFloat(String(activeVariation.variation_amount)) * 100)}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                    Change Plan ▾
                                  </span>
                                </div>
                              </button>

                              <PlanSelectorModal
                                isOpen={isPlanModalOpen}
                                onClose={() => setIsPlanModalOpen(false)}
                                title="Select Mobile Data Bundle"
                                variations={variations}
                                selectedCode={selectedVariationCode}
                                onSelect={(code) => setSelectedVariationCode(code)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AIRTIME TAB */}
                    {activeCategory === 'AIRTIME' && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            Buy Airtime Top-Up
                          </h3>
                          <Badge variant="success" size="sm">
                            Instant Airtime
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Network Operator
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {services.map((svc) => (
                              <button
                                key={svc.serviceID}
                                type="button"
                                onClick={() => setSelectedServiceID(svc.serviceID)}
                                className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                                  selectedServiceID === svc.serviceID
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {svc.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Input
                          label="Recipient Phone Number"
                          placeholder="e.g. 08031234567"
                          value={airtimePhone}
                          onChange={(e) => setAirtimePhone(e.target.value)}
                          required
                        />

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Airtime Amount (NGN)
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {[500, 1000, 2000, 5000, 10000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setAirtimeAmountNaira(amt)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  airtimeAmountNaira === amt
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                ₦{amt.toLocaleString()}
                              </button>
                            ))}
                          </div>
                          <Input
                            type="number"
                            min="100"
                            step="100"
                            value={airtimeAmountNaira}
                            onChange={(e) => setAirtimeAmountNaira(parseInt(e.target.value, 10) || 100)}
                          />
                        </div>
                      </div>
                    )}

                    {/* CABLE TV TAB */}
                    {activeCategory === 'CABLE' && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Tv className="w-4 h-4 text-emerald-600" />
                            Renew Cable TV Subscription
                          </h3>
                          <Badge variant="info" size="sm">
                            VTpass Cable
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Cable TV Provider
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {services.map((svc) => (
                              <button
                                key={svc.serviceID}
                                type="button"
                                onClick={() => setSelectedServiceID(svc.serviceID)}
                                className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                                  selectedServiceID === svc.serviceID
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {svc.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                              Smartcard / IUC Number
                            </label>
                            <button
                              type="button"
                              onClick={handleVerifyCable}
                              disabled={isVerifyingCable || !cableSmartcard.trim()}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>{isVerifyingCable ? 'Verifying...' : 'Verify Smartcard'}</span>
                            </button>
                          </div>
                          <Input
                            placeholder="Enter Smartcard / IUC number..."
                            value={cableSmartcard}
                            onChange={(e) => setCableSmartcard(e.target.value)}
                          />
                        </div>

                        {cableVerification && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Customer Name: {cableVerification.customerName}</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Contact Phone Number"
                            placeholder="e.g. 08031234567"
                            value={cableContactPhone}
                            onChange={(e) => setCableContactPhone(e.target.value)}
                            required
                          />

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                              Subscription Type
                            </label>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {[
                                { id: 'change' as const, label: 'Change Package' },
                                { id: 'renew' as const, label: 'Renew Package' },
                              ].map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSubscriptionType(s.id)}
                                  className={`p-2.5 text-center rounded-xl border text-xs font-bold ${
                                    subscriptionType === s.id
                                      ? 'border-emerald-600 bg-emerald-50 font-bold text-slate-900'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Package / Bouquet
                          </label>
                          {isVariationsLoading ? (
                            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsPlanModalOpen(true)}
                                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-between text-left transition-all shadow-2xs group"
                              >
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selected Package</span>
                                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                                    {activeVariation ? activeVariation.name : 'Choose cable TV bouquet...'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {activeVariation && (
                                    <span className="font-extrabold text-sm text-emerald-700">
                                      {formatNaira(parseFloat(String(activeVariation.variation_amount)) * 100)}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                    Change Package ▾
                                  </span>
                                </div>
                              </button>

                              <PlanSelectorModal
                                isOpen={isPlanModalOpen}
                                onClose={() => setIsPlanModalOpen(false)}
                                title="Select Cable TV Bouquet"
                                variations={variations}
                                selectedCode={selectedVariationCode}
                                onSelect={(code) => setSelectedVariationCode(code)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}
          </div>

          {/* Right Column: Transaction Summary & Two-Step Review / Pay */}
          <div className="space-y-3">
            <Card className="border-emerald-500/30 shadow-md sticky top-24 space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {orderPreview ? 'Review Order Summary' : 'Order Summary'}
                </h3>
                {orderPreview && (
                  <Badge variant="warning" size="sm">Reviewing</Badge>
                )}
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Category</span>
                  <span className="font-bold text-slate-900">{activeCategory}</span>
                </div>

                {activeCategory === 'ELECTRICITY' && currentState && (
                  <div className="flex justify-between text-slate-600">
                    <span>Selected State</span>
                    <span className="font-bold text-slate-900">{currentState.name}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Service Provider</span>
                  <span className="font-bold text-slate-900">
                    {selectedProviderObj?.name || selectedServiceID || '—'}
                  </span>
                </div>

                {isVariationCategory && activeVariation && (
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Plan</span>
                    <span className="font-bold text-slate-900">{activeVariation.name}</span>
                  </div>
                )}

                {activeCategory === 'ELECTRICITY' && !orderPreview && (
                  <div className="flex justify-between text-slate-600">
                    <span>Token Amount</span>
                    <span className="font-bold text-slate-900">{formatNaira(electricityAmountNaira * 100)}</span>
                  </div>
                )}

                {orderPreview && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Electricity / Principal</span>
                      <span className="font-bold text-slate-900">
                        {formatNaira(
                          orderPreview.fee !== undefined && orderPreview.amount > orderPreview.fee
                            ? orderPreview.amount - orderPreview.fee
                            : orderPreview.amount
                        )}
                      </span>
                    </div>
                    {orderPreview.fee !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>Lofix service fee</span>
                        <span className="font-bold text-slate-900">{formatNaira(orderPreview.fee)}</span>
                      </div>
                    )}
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono text-[11px] space-y-0.5 mt-2">
                      <p>Order Reference: <strong>#{orderPreview.orderId}</strong></p>
                      <p>Backend Status: <strong>{orderPreview.status}</strong></p>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Payable</span>
                  <span className="text-2xl font-black text-emerald-700 font-display">
                    {formatNaira(
                      orderPreview
                        ? (orderPreview.totalAmount || orderPreview.amount)
                        : activeCategory === 'ELECTRICITY'
                        ? electricityAmountNaira * 100
                        : activeCategory === 'AIRTIME'
                        ? airtimeAmountNaira * 100
                        : activeVariation
                        ? parseFloat(String(orderPreview ? 0 : activeVariation.variation_amount)) * 100
                        : 0
                    )}
                  </span>
                </div>
              </div>

              {!orderPreview ? (
                <>
                  {activeCategory === 'ELECTRICITY' && !electricityVerification ? (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="w-full font-bold"
                        isLoading={isVerifyingElectricity}
                        disabled={
                          isVerifyingElectricity ||
                          !meterNumber.trim() ||
                          !selectedServiceID ||
                          (selectedProviderObj && selectedProviderObj.available === false)
                        }
                        onClick={handleVerifyElectricity}
                        leftIcon={<Search className="w-4 h-4" />}
                      >
                        {isVerifyingElectricity ? 'Verifying Meter...' : 'Verify Customer Meter'}
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="w-full font-bold"
                        isLoading={isReviewingOrder}
                        disabled={
                          isReviewingOrder ||
                          (activeCategory === 'ELECTRICITY' &&
                            (!electricityVerification || (selectedProviderObj && selectedProviderObj.available === false)))
                        }
                        onClick={handleReviewOrder}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                      >
                        Create Order & Pay
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="pt-2 space-y-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full font-bold"
                    onClick={() => setCheckoutTransactionId(orderPreview.transactionId)}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Proceed to Secure Payment ({formatNaira(orderPreview.totalAmount || orderPreview.amount)})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full font-bold text-xs"
                    onClick={() => setOrderPreview(null)}
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  >
                    Back to Edit Order
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by VTpass & Paystack Security</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          addToast('success', 'Utility payment verified successfully! Order confirmed.');
          setTimeout(() => {
            navigate('/dashboard?tab=utilities');
          }, 1200);
        }}
        onCancel={() => {
          addToast('info', 'Payment paused. You can complete payment anytime in Utility Transactions.');
        }}
      />
    </CustomerLayout>
  );
};
