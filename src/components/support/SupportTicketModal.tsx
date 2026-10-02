import React, { useState } from 'react';
import { Button } from '../common/Button';
import { supportApi, SupportTicketResult } from '../../api/support';
import { AlertCircle, CheckCircle2, LifeBuoy, X } from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  transactionId?: string | number;
  providerReference?: string;
  defaultMessage?: string;
  onEmailSupportClick?: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  orderId,
  transactionId,
  providerReference,
  defaultMessage,
  onEmailSupportClick,
}) => {
  const [message, setMessage] = useState(defaultMessage || 'Payment succeeded but my order delivery encountered an issue.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ message: string; ticket: SupportTicketResult } | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessResult(null);

    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 3000) {
      setErrorMsg('Message must be between 1 and 3000 characters.');
      return;
    }

    if (retryAfterSeconds > 0) {
      setErrorMsg(`Rate limited (429). Please wait ${retryAfterSeconds}s before retrying.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await supportApi.createSupportTicket({
        orderId,
        message: trimmed,
      });
      setSuccessResult(res);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429) {
        const ra = err.response?.headers?.['retry-after']
          ? parseInt(err.response.headers['retry-after'], 10)
          : err.response?.data?.retryAfterSeconds || 30;
        setRetryAfterSeconds(ra);
        setErrorMsg(err.response?.data?.message || `Rate limit exceeded (429). Please wait ${ra}s.`);
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit support ticket.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-0">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Contact Support</h3>
              <p className="text-xs text-slate-300 font-mono">Order #{orderId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {successResult ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{successResult.message}</h4>
                <p className="text-xs text-slate-500">
                  Ticket ID: <span className="font-mono font-bold text-slate-900">#{successResult.ticket.id}</span> | Status: <span className="font-bold text-emerald-700">{successResult.ticket.status}</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Support is reviewing your order details. Keep your order delivery status separate while reconciliation continues.
              </p>
              <div className="pt-2 flex gap-2">
                <Button variant="primary" size="sm" className="w-full font-bold" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono text-slate-600">
                <p>Order ID: <strong>#{orderId}</strong></p>
                {transactionId && <p>Transaction ID: <strong>#{transactionId}</strong></p>}
                {providerReference && <p>Provider Ref: <strong>{providerReference}</strong></p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Issue Description (1–3000 characters)
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={3000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or missing token..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || retryAfterSeconds > 0 || !message.trim()}
                  leftIcon={<LifeBuoy className="w-4 h-4" />}
                >
                  {retryAfterSeconds > 0 ? `Rate limited (${retryAfterSeconds}s)` : 'Submit Support Ticket'}
                </Button>

                {onEmailSupportClick && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full font-bold text-xs"
                    onClick={onEmailSupportClick}
                  >
                    Email support@lofix.ng instead
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
