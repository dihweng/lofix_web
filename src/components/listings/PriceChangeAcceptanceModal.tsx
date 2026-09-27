import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatNaira } from '../../utils/money';
import { AlertTriangle, Check } from 'lucide-react';

interface PriceChangeAcceptanceModalProps {
  isOpen: boolean;
  quotedTotal: number; // kobo
  serverTotal: number; // kobo
  onAccept: () => void;
  onDecline: () => void;
}

export const PriceChangeAcceptanceModal: React.FC<PriceChangeAcceptanceModalProps> = ({
  isOpen,
  quotedTotal,
  serverTotal,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) return null;

  const difference = serverTotal - quotedTotal;
  const isIncrease = difference > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDecline}
      title="Updated Price Notice"
      maxWidth="md"
    >
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <h4 className="font-bold text-sm">Server Price Update</h4>
            <p>
              The booking price was recalculated by the server upon booking creation. Please review and accept the updated total to proceed with payment.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Quoted Estimate:</span>
            <span className="line-through">{formatNaira(quotedTotal)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-900 font-bold">
            <span>Updated Booking Total:</span>
            <span className="text-emerald-700 text-lg font-extrabold font-display">
              {formatNaira(serverTotal)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Price Difference:</span>
            <span className={isIncrease ? 'text-amber-600' : 'text-emerald-600'}>
              {isIncrease ? '+' : ''}
              {formatNaira(difference)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onDecline}>
            Decline & Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAccept}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Accept Updated Price & Pay
          </Button>
        </div>
      </div>
    </Modal>
  );
};
