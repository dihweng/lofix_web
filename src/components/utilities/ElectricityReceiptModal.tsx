import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { VtpassOrderDetail } from '../../api/utilities';
import { formatNaira } from '../../utils/money';
import { Printer, CheckCircle2, Copy, Zap } from 'lucide-react';

interface ElectricityReceiptModalProps {
  isOpen: boolean;
  order: VtpassOrderDetail | null;
  onClose: () => void;
  onCopyToken?: (token: string) => void;
  isCopied?: boolean;
}

export const ElectricityReceiptModal: React.FC<ElectricityReceiptModalProps> = ({
  isOpen,
  order,
  onClose,
  onCopyToken,
  isCopied,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const electricity = order.electricity;
  const receipt = electricity?.receipt;

  const isSuccess = (order.deliveryStatus || order.status) === 'SUCCESS';
  const token = order.token;
  const units = receipt?.units || order.units;

  const formatField = (val: number | string | undefined | null) => {
    if (val === null || val === undefined) return 'Not provided';
    if (typeof val === 'number') return formatNaira(val);
    if (!isNaN(Number(val))) return formatNaira(Number(val));
    return String(val);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Electricity Bill & Vending Receipt" maxWidth="lg">
      <div className="space-y-6 print:p-0">
        {/* Header Card */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-current text-white" />
              </div>
              <span className="text-lg font-extrabold font-display">Lofix Utilities</span>
            </div>
            <Badge variant={isSuccess ? 'success' : 'warning'} size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {isSuccess ? 'VENDED & DELIVERED' : (order.deliveryStatus || order.status)}
            </Badge>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Order Reference</p>
              <p className="text-sm font-mono font-bold text-emerald-400">#ORDER-{order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Payable</p>
              <p className="text-xl font-black font-display text-white">{formatNaira(order.totalAmount || order.amount)}</p>
            </div>
          </div>
        </div>

        {/* Token Card (if success) */}
        {isSuccess && token && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-center">
            <p className="text-xs font-bold uppercase text-amber-800">
              Generated Electricity Token
            </p>
            <p className="text-xl font-mono font-black text-amber-950 tracking-wider">
              {token}
            </p>
            {units && <p className="text-xs font-semibold text-amber-700">Units: {units}</p>}
            {onCopyToken && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 font-bold"
                onClick={() => onCopyToken(token)}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Token Copied!' : 'Copy Token'}
              </Button>
            )}
          </div>
        )}

        {/* Customer & Meter Information */}
        <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5">
            Customer & Meter Details
          </h4>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Customer Name</span>
            <span className="font-bold text-slate-900">{receipt?.customerName || electricity?.customerName || 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Customer Address</span>
            <span className="font-bold text-slate-900 text-right max-w-[240px] truncate">{receipt?.customerAddress || electricity?.customerAddress || 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Meter Number</span>
            <span className="font-bold font-mono text-slate-900">{electricity?.meterNumber || order.target}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Meter Type</span>
            <span className="font-bold uppercase text-slate-900">{electricity?.meterType || 'Prepaid'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Service Provider (DisCo)</span>
            <span className="font-bold text-slate-900">{order.serviceName || order.serviceID}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1.5">
            Server Price Breakdown
          </h4>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Electricity Amount</span>
            <span className="font-bold text-slate-900">{formatNaira(order.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Lofix Service Fee</span>
            <span className="font-bold text-slate-900">{formatNaira(order.fee || 0)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
            <span>Total Payable</span>
            <span className="text-emerald-700">{formatNaira(order.totalAmount || order.amount)}</span>
          </div>
        </div>

        {/* Detailed Provider Receipt (if delivered) */}
        {receipt ? (
          <div className="space-y-3 text-xs bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] border-b border-emerald-200 pb-1.5 flex items-center justify-between">
              <span>Provider Delivery Receipt</span>
              {receipt.receiptNumber && <span className="font-mono text-[10px]">#{receipt.receiptNumber}</span>}
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Units Supplied</span>
              <span className="font-bold text-slate-900">{receipt.units || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Tariff</span>
              <span className="font-bold text-slate-900">{formatField(receipt.tariff)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Provider tax/VAT</span>
              <span className="font-bold text-slate-900">{formatField(receipt.taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Debt Amount</span>
              <span className="font-bold text-slate-900">{formatField(receipt.debtAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Token Amount</span>
              <span className="font-bold text-slate-900">{formatField(receipt.tokenAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-semibold">Fixed Charge Amount</span>
              <span className="font-bold text-slate-900">{formatField(receipt.fixedChargeAmount)}</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <p className="font-bold mb-0.5">Receipt Pending:</p>
            Electricity units, applicable taxes and provider deductions will appear on your receipt when supplied by the provider.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
          <Button variant="outline" size="md" onClick={onClose}>
            Close / Continue
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
