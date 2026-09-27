import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  transactionsApi,
  SystemTransaction,
  PaymentMethodOption,
} from '../../api/transactions';
import { resumePaystackCheckout } from '../../utils/paystack';
import { formatNaira } from '../../utils/money';
import {
  CreditCard,
  Building,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  transactionId: number | null;
  onClose: () => void;
  onSuccess: (transaction: SystemTransaction) => void;
  onCancel?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
  onCancel,
}) => {
  const activeTxId = transactionId || 0;

  // Fetch Transaction Details
  const {
    data: transaction,
    isLoading: isLoadingTx,
  } = useQuery({
    queryKey: ['paymentTransaction', activeTxId],
    queryFn: () => transactionsApi.getTransactionById(activeTxId),
    enabled: isOpen && activeTxId > 0,
  });

  // Fetch Payment Methods
  const {
    data: paymentMethods = [],
    isLoading: isLoadingMethods,
  } = useQuery({
    queryKey: ['paymentMethods', activeTxId],
    queryFn: () => transactionsApi.getPaymentMethods(activeTxId),
    enabled: isOpen && activeTxId > 0,
  });

  // Payment UI state
  const [selectedMethod, setSelectedMethod] = useState<string>('CARD');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [billFulfillmentPending, setBillFulfillmentPending] = useState(false);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      const active = paymentMethods.find((m) => m.active !== false) || paymentMethods[0];
      setSelectedMethod(active.code);
    }
  }, [paymentMethods]);

  useEffect(() => {
    if (!isOpen) {
      setIsInitializing(false);
      setIsVerifying(false);
      setActiveReference(null);
      setErrorMsg(null);
      setVerificationPending(false);
      setIsSuccess(false);
      setBillFulfillmentPending(false);
    }
  }, [isOpen]);

  if (!isOpen || !activeTxId) return null;

  const handleVerifyReference = async (ref: string) => {
    setIsVerifying(true);
    setErrorMsg(null);
    console.log(`[PaymentModal] Verifying reference "${ref}" for transaction #${activeTxId}...`);

    try {
      const verifyRes = await transactionsApi.verifyPayment(activeTxId, ref);
      console.log(`[PaymentModal] Verify result for #${activeTxId}:`, verifyRes);

      // Verification payment record check: status can be 'paid', 'PAID', 'COMPLETED', or verified === true
      const paymentRecord = verifyRes.data || verifyRes.payment;
      const statusValue = paymentRecord?.status || verifyRes.status;

      const isPaid =
        verifyRes.verified === true ||
        statusValue === 'paid' ||
        statusValue === 'PAID' ||
        statusValue === 'COMPLETED' ||
        statusValue === 'success' ||
        statusValue === 'SUCCESS';

      if (isPaid) {
        const updatedTx = await transactionsApi.getTransactionById(activeTxId);

        if (updatedTx.type === 'BILL' && updatedTx.bill_purchase?.status === 'PENDING') {
          setBillFulfillmentPending(true);
        }

        setIsSuccess(true);
        onSuccess(updatedTx);
      } else {
        setVerificationPending(true);
        const backendDetail = verifyRes.message || (statusValue ? `Status: ${statusValue}` : 'Incomplete on server');
        setErrorMsg(`Payment verification pending: ${backendDetail}. Click "Verify Payment Status" to re-check.`);
      }
    } catch (err: any) {
      console.error(`[PaymentModal] Verify error for #${activeTxId}:`, err);
      setVerificationPending(true);
      const serverErr =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Verification error';
      setErrorMsg(`Verification error: ${serverErr}. Click "Verify Payment Status" to re-check.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInitializeCheckout = async () => {
    if (isInitializing || isVerifying) return;

    setIsInitializing(true);
    setErrorMsg(null);
    setVerificationPending(false);
    console.log(`[PaymentModal] Initializing checkout for transaction #${activeTxId} with method "${selectedMethod}"...`);

    try {
      const checkout = await transactionsApi.initializePayment(activeTxId, selectedMethod);
      console.log(`[PaymentModal] Initialized checkout response:`, checkout);

      setActiveReference(checkout.reference);

      await resumePaystackCheckout({
        accessCode: checkout.accessCode,
        reference: checkout.reference,
        authorizationUrl: checkout.authorizationUrl,
        onSuccess: (ref) => {
          console.log(`[PaymentModal] Paystack popup onSuccess callback with ref: "${ref}"`);
          handleVerifyReference(ref);
        },
        onCancel: () => {
          console.log(`[PaymentModal] Paystack popup cancelled by user.`);
          setIsInitializing(false);
          setVerificationPending(true);
          if (onCancel) onCancel();
        },
        onError: (err) => {
          console.error(`[PaymentModal] Paystack popup onError:`, err);
          setIsInitializing(false);
          setErrorMsg(err || 'Failed to resume payment transaction.');
        },
      });
    } catch (err: any) {
      console.error(`[PaymentModal] Initialize checkout failed for #${activeTxId}:`, err);
      if (err.response?.status === 401) {
        setErrorMsg('Your session has expired. Please sign in again to complete checkout.');
      } else {
        const detail = err.response?.data?.message || err.response?.data?.error || err.message || 'Payment initialization failed.';
        setErrorMsg(`Initialization error: ${detail}`);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const getMethodIcon = (code: string) => {
    switch (code) {
      case 'CARD':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'BANK_TRANSFER':
        return <Building className="w-5 h-5 text-sky-600" />;
      case 'USSD':
        return <Phone className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Order Checkout"
      maxWidth="md"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Checkout Alert</p>
              <p className="text-[11px] text-red-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Payment Confirmed!</h3>
            <p className="text-xs text-emerald-700">
              {billFulfillmentPending
                ? 'Payment verified! Bill fulfillment is currently processing in the background.'
                : 'Your order has been verified and confirmed.'}
            </p>
          </div>
        )}

        {isLoadingTx ? (
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ) : transaction ? (
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Transaction #{transaction.reference || transaction.id}
              </span>
              <Badge variant={transaction.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                {transaction.status}
              </Badge>
            </div>

            <p className="text-xs text-slate-300 line-clamp-1">
              {transaction.description || `Lofix Order #${transaction.id}`}
            </p>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Total Payable</span>
              <span className="text-2xl font-black text-emerald-400 font-display">
                {formatNaira(transaction.amount)}
              </span>
            </div>
          </div>
        ) : null}

        {!isSuccess && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Payment Method
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Backend Encrypted
              </span>
            </div>

            {isLoadingMethods ? (
              <div className="space-y-2">
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((method: PaymentMethodOption) => {
                  const isSelected = selectedMethod === method.code;
                  return (
                    <button
                      key={method.code}
                      type="button"
                      disabled={isInitializing || isVerifying}
                      onClick={() => setSelectedMethod(method.code)}
                      className={`w-full p-3.5 text-left rounded-xl border-2 flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          {getMethodIcon(method.code)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{method.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {method.description || `Pay via ${method.name}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {verificationPending && activeReference ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isVerifying}
                onClick={() => handleVerifyReference(activeReference)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Verify Payment Status
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isInitializing || isVerifying}
                disabled={isInitializing || isVerifying || isLoadingMethods}
                onClick={handleInitializeCheckout}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Proceed to Pay
              </Button>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-500"
              >
                Close Window
              </Button>

              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Paystack Gateway Guaranteed
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
