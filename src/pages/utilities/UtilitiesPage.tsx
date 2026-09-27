import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  utilitiesApi,
  UtilityCategory,
  MeterVerificationResult,
  SmartcardVerificationResult,
} from '../../api/utilities';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { ToastMessage } from '../../components/common/Toast';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { formatNaira } from '../../utils/money';
import { useAuth } from '../../context/AuthContext';
import { AuthModals } from '../../components/auth/AuthModals';
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
} from 'lucide-react';

export const UtilitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeCategory, setActiveCategory] = useState<UtilityCategory>('ELECTRICITY');

  // Queries
  const { data: discos = [] } = useQuery({
    queryKey: ['utilityDiscos'],
    queryFn: utilitiesApi.getElectricityDiscos,
  });

  const { data: dataPlans = [] } = useQuery({
    queryKey: ['utilityDataPlans'],
    queryFn: () => utilitiesApi.getDataPlans(),
  });

  const { data: cablePackages = [] } = useQuery({
    queryKey: ['utilityCablePackages'],
    queryFn: () => utilitiesApi.getCableTvPackages(),
  });

  // Electricity State
  const [selectedDisco, setSelectedDisco] = useState<string>('IKEDC');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [meterVerification, setMeterVerification] = useState<MeterVerificationResult | null>(null);
  const [isVerifyingMeter, setIsVerifyingMeter] = useState(false);
  const [electricityAmount, setElectricityAmount] = useState<number>(5000); // NGN

  // Mobile Data State
  const [selectedDataNetwork, setSelectedDataNetwork] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [dataPhoneNumber, setDataPhoneNumber] = useState<string>('');
  const [selectedDataPlanId, setSelectedDataPlanId] = useState<string>('');

  // Airtime State
  const [selectedAirtimeNetwork, setSelectedAirtimeNetwork] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [airtimePhoneNumber, setAirtimePhoneNumber] = useState<string>('');
  const [airtimeAmount, setAirtimeAmount] = useState<number>(1000); // NGN

  // Cable TV State
  const [selectedCableProvider, setSelectedCableProvider] = useState<'DSTV' | 'GOTV' | 'STARTIMES' | 'SHOWMAX'>('DSTV');
  const [smartcardNumber, setSmartcardNumber] = useState<string>('');
  const [smartcardVerification, setSmartcardVerification] = useState<SmartcardVerificationResult | null>(null);
  const [isVerifyingSmartcard, setIsVerifyingSmartcard] = useState(false);
  const [selectedCablePackageId, setSelectedCablePackageId] = useState<string>('');

  // Modals & Payment State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutTransactionId, setCheckoutTransactionId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Default data plan when data network changes
  useEffect(() => {
    const available = dataPlans.filter((p) => p.network === selectedDataNetwork);
    if (available.length > 0) {
      setSelectedDataPlanId(available[0].id);
    }
  }, [selectedDataNetwork, dataPlans]);

  // Default cable package when cable provider changes
  useEffect(() => {
    const available = cablePackages.filter((p) => p.provider === selectedCableProvider);
    if (available.length > 0) {
      setSelectedCablePackageId(available[0].id);
    }
  }, [selectedCableProvider, cablePackages]);

  // Verify Electricity Meter
  const handleVerifyMeter = async () => {
    if (!meterNumber.trim() || meterNumber.length < 6) {
      addToast('error', 'Please enter a valid meter number.');
      return;
    }
    setIsVerifyingMeter(true);
    try {
      const res = await utilitiesApi.verifyMeterNumber(selectedDisco, meterNumber.trim(), meterType);
      setMeterVerification(res);
      addToast('success', `Meter verified! Account Name: ${res.customerName}`);
    } catch {
      addToast('error', 'Meter verification failed. Please check your meter number.');
    } finally {
      setIsVerifyingMeter(false);
    }
  };

  // Verify Cable TV Smartcard
  const handleVerifySmartcard = async () => {
    if (!smartcardNumber.trim() || smartcardNumber.length < 6) {
      addToast('error', 'Please enter a valid smartcard / IUC number.');
      return;
    }
    setIsVerifyingSmartcard(true);
    try {
      const res = await utilitiesApi.verifySmartcardNumber(selectedCableProvider, smartcardNumber.trim());
      setSmartcardVerification(res);
      addToast('success', `Decoder verified! Account Name: ${res.customerName}`);
    } catch {
      addToast('error', 'Smartcard verification failed. Please check IUC number.');
    } finally {
      setIsVerifyingSmartcard(false);
    }
  };

  // Handle Utility Purchase
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('info', 'Please sign in or register to complete utility payment.');
      setIsAuthModalOpen(true);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let payloadAmountKobo = 0;
      let accountNumber = '';
      let providerId = '';
      let planId: string | undefined = undefined;
      let customerName: string | undefined = undefined;

      if (activeCategory === 'ELECTRICITY') {
        if (!meterNumber.trim()) {
          addToast('error', 'Please enter your meter number.');
          setIsSubmitting(false);
          return;
        }
        providerId = selectedDisco;
        accountNumber = meterNumber.trim();
        payloadAmountKobo = electricityAmount * 100;
        customerName = meterVerification?.customerName;
      } else if (activeCategory === 'DATA') {
        if (!dataPhoneNumber.trim() || dataPhoneNumber.length < 10) {
          addToast('error', 'Please enter a valid phone number.');
          setIsSubmitting(false);
          return;
        }
        const plan = dataPlans.find((p) => p.id === selectedDataPlanId);
        if (!plan) {
          addToast('error', 'Please select a data bundle plan.');
          setIsSubmitting(false);
          return;
        }
        providerId = selectedDataNetwork;
        accountNumber = dataPhoneNumber.trim();
        planId = selectedDataPlanId;
        payloadAmountKobo = plan.price;
      } else if (activeCategory === 'AIRTIME') {
        if (!airtimePhoneNumber.trim() || airtimePhoneNumber.length < 10) {
          addToast('error', 'Please enter a valid phone number.');
          setIsSubmitting(false);
          return;
        }
        providerId = selectedAirtimeNetwork;
        accountNumber = airtimePhoneNumber.trim();
        payloadAmountKobo = airtimeAmount * 100;
      } else if (activeCategory === 'CABLE_TV') {
        if (!smartcardNumber.trim()) {
          addToast('error', 'Please enter your smartcard / IUC number.');
          setIsSubmitting(false);
          return;
        }
        const pkg = cablePackages.find((p) => p.id === selectedCablePackageId);
        if (!pkg) {
          addToast('error', 'Please select a cable TV bouquet.');
          setIsSubmitting(false);
          return;
        }
        providerId = selectedCableProvider;
        accountNumber = smartcardNumber.trim();
        planId = selectedCablePackageId;
        payloadAmountKobo = pkg.price;
        customerName = smartcardVerification?.customerName;
      }

      const res = await utilitiesApi.purchaseUtility({
        category: activeCategory,
        providerId,
        accountNumber,
        meterType: activeCategory === 'ELECTRICITY' ? meterType : undefined,
        planId,
        amount: payloadAmountKobo,
        customerName,
      });

      addToast('success', `${activeCategory} transaction created! Opening Paystack...`);
      setCheckoutTransactionId(res.transactionId);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || err.message || 'Transaction creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout toasts={toasts} onDismissToast={removeToast}>
      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Instant Utility Bills Payment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              Buy Electricity, Data, Airtime & Cable TV
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Instant meter token generation, data recharges, airtime top-ups, and cable TV renewals powered by Lofix Paystack NGN checkout.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2 max-w-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Delivery Guarantee</span>
            </div>
            <p className="text-slate-300">
              Tokens and recharges are generated instantly upon payment confirmation.
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
            { id: 'CABLE_TV' as const, label: 'Cable TV Renewal', icon: <Tv className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
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
              <Card className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Buy Electricity Meter Token
                  </h3>
                  <Badge variant="success" size="sm">
                    All DisCos Active
                  </Badge>
                </div>

                {/* DisCo Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Electricity Distribution Company (DisCo)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {discos.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDisco(d.id);
                          setMeterVerification(null);
                        }}
                        className={`p-3 text-left rounded-xl border text-xs transition-all ${
                          selectedDisco === d.id
                            ? 'border-emerald-600 bg-emerald-50/50 font-bold text-slate-900 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <p className="font-bold">{d.shortCode}</p>
                        <p className="text-[10px] text-slate-500 truncate">{d.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meter Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Meter Type
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
                          setMeterVerification(null);
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

                {/* Meter Number with Verify */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Meter Number
                    </label>
                    <button
                      type="button"
                      onClick={handleVerifyMeter}
                      disabled={isVerifyingMeter || !meterNumber.trim()}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isVerifyingMeter ? 'Verifying...' : 'Verify Meter'}</span>
                    </button>
                  </div>
                  <Input
                    placeholder="Enter your 10-13 digit meter number..."
                    value={meterNumber}
                    onChange={(e) => {
                      setMeterNumber(e.target.value);
                      setMeterVerification(null);
                    }}
                  />
                </div>

                {meterVerification && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified Customer: {meterVerification.customerName}</span>
                    </div>
                    {meterVerification.address && (
                      <p className="text-[11px] text-emerald-700">{meterVerification.address}</p>
                    )}
                  </div>
                )}

                {/* Amount in NGN */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Amount (NGN)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setElectricityAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          electricityAmount === amt
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
                    value={electricityAmount}
                    onChange={(e) => setElectricityAmount(parseInt(e.target.value, 10) || 500)}
                  />
                </div>
              </Card>
            )}

            {/* MOBILE DATA TAB */}
            {activeCategory === 'DATA' && (
              <Card className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    Buy Mobile Data Bundles
                  </h3>
                  <Badge variant="info" size="sm">
                    Instant Top-Up
                  </Badge>
                </div>

                {/* Network Operator */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Network Operator
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSelectedDataNetwork(net)}
                        className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                          selectedDataNetwork === net
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Recipient Phone Number"
                  placeholder="e.g. 08031234567"
                  value={dataPhoneNumber}
                  onChange={(e) => setDataPhoneNumber(e.target.value)}
                />

                {/* Data Plan Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Data Bundle Plan ({selectedDataNetwork})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dataPlans
                      .filter((p) => p.network === selectedDataNetwork)
                      .map((plan) => {
                        const isSelected = selectedDataPlanId === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedDataPlanId(plan.id)}
                            className={`p-3.5 text-left rounded-xl border-2 transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900">{plan.name}</p>
                              <p className="text-[10px] text-slate-500">Validity: {plan.validity}</p>
                            </div>
                            <span className="font-extrabold text-xs text-emerald-700">
                              {formatNaira(plan.price)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </Card>
            )}

            {/* AIRTIME TAB */}
            {activeCategory === 'AIRTIME' && (
              <Card className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Buy Airtime Top-Up
                  </h3>
                  <Badge variant="success" size="sm">
                    Instant Recharge
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Network Operator
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSelectedAirtimeNetwork(net)}
                        className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                          selectedAirtimeNetwork === net
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Recipient Phone Number"
                  placeholder="e.g. 08031234567"
                  value={airtimePhoneNumber}
                  onChange={(e) => setAirtimePhoneNumber(e.target.value)}
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
                        onClick={() => setAirtimeAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          airtimeAmount === amt
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
                    value={airtimeAmount}
                    onChange={(e) => setAirtimeAmount(parseInt(e.target.value, 10) || 100)}
                  />
                </div>
              </Card>
            )}

            {/* CABLE TV TAB */}
            {activeCategory === 'CABLE_TV' && (
              <Card className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-600" />
                    Renew Cable TV Subscription
                  </h3>
                  <Badge variant="info" size="sm">
                    Instant Activation
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Cable TV Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['DSTV', 'GOTV', 'STARTIMES', 'SHOWMAX'] as const).map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => {
                          setSelectedCableProvider(prov);
                          setSmartcardVerification(null);
                        }}
                        className={`p-3 text-center rounded-xl border text-xs font-extrabold transition-all ${
                          selectedCableProvider === prov
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {prov}
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
                      onClick={handleVerifySmartcard}
                      disabled={isVerifyingSmartcard || !smartcardNumber.trim()}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isVerifyingSmartcard ? 'Verifying...' : 'Verify Smartcard'}</span>
                    </button>
                  </div>
                  <Input
                    placeholder="Enter 10-11 digit IUC / Smartcard number..."
                    value={smartcardNumber}
                    onChange={(e) => {
                      setSmartcardNumber(e.target.value);
                      setSmartcardVerification(null);
                    }}
                  />
                </div>

                {smartcardVerification && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Customer: {smartcardVerification.customerName}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Package / Bouquet ({selectedCableProvider})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cablePackages
                      .filter((p) => p.provider === selectedCableProvider)
                      .map((pkg) => {
                        const isSelected = selectedCablePackageId === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedCablePackageId(pkg.id)}
                            className={`p-3.5 text-left rounded-xl border-2 transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900">{pkg.name}</p>
                              <p className="text-[10px] text-slate-500">{pkg.description}</p>
                            </div>
                            <span className="font-extrabold text-xs text-emerald-700">
                              {formatNaira(pkg.price)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <Card className="border-emerald-500/30 shadow-md sticky top-24 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Transaction Summary
                </h3>
              </div>

              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Category</span>
                  <span className="font-bold text-slate-900">{activeCategory}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Service Provider</span>
                  <span className="font-bold text-slate-900">
                    {activeCategory === 'ELECTRICITY'
                      ? selectedDisco
                      : activeCategory === 'DATA'
                      ? selectedDataNetwork
                      : activeCategory === 'AIRTIME'
                      ? selectedAirtimeNetwork
                      : selectedCableProvider}
                  </span>
                </div>

                {activeCategory === 'ELECTRICITY' && meterNumber && (
                  <div className="flex justify-between text-slate-600">
                    <span>Meter Number</span>
                    <span className="font-bold font-mono text-slate-900">{meterNumber}</span>
                  </div>
                )}

                {activeCategory === 'CABLE_TV' && smartcardNumber && (
                  <div className="flex justify-between text-slate-600">
                    <span>Smartcard Number</span>
                    <span className="font-bold font-mono text-slate-900">{smartcardNumber}</span>
                  </div>
                )}

                {(activeCategory === 'DATA' || activeCategory === 'AIRTIME') &&
                  (dataPhoneNumber || airtimePhoneNumber) && (
                    <div className="flex justify-between text-slate-600">
                      <span>Phone Number</span>
                      <span className="font-bold font-mono text-slate-900">
                        {activeCategory === 'DATA' ? dataPhoneNumber : airtimePhoneNumber}
                      </span>
                    </div>
                  )}

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Payable</span>
                  <span className="text-2xl font-black text-emerald-700 font-display">
                    {formatNaira(
                      activeCategory === 'ELECTRICITY'
                        ? electricityAmount * 100
                        : activeCategory === 'AIRTIME'
                        ? airtimeAmount * 100
                        : activeCategory === 'DATA'
                        ? dataPlans.find((p) => p.id === selectedDataPlanId)?.price || 0
                        : cablePackages.find((p) => p.id === selectedCablePackageId)?.price || 0
                    )}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full font-bold"
                isLoading={isSubmitting}
                onClick={handlePurchase}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Pay & Instant Token / Top-Up
              </Button>

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by Paystack PCI-DSS Security</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <AuthModals
        isOpen={isAuthModalOpen}
        mode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchMode={() => {}}
      />

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={!!checkoutTransactionId}
        transactionId={checkoutTransactionId}
        onClose={() => setCheckoutTransactionId(null)}
        onSuccess={() => {
          setCheckoutTransactionId(null);
          addToast('success', 'Utility payment verified! Token / Top-up delivered.');
          setTimeout(() => {
            navigate('/dashboard?tab=utilities');
          }, 1200);
        }}
        onCancel={() => {
          addToast('info', 'Utility checkout cancelled.');
        }}
      />
    </CustomerLayout>
  );
};
