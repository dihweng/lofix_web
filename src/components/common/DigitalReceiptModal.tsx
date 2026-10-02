import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { CleaningBooking } from '../../api/bookings';
import { ShortletBooking } from '../../api/shortletBookings';
import { formatNaira } from '../../utils/money';
import { formatDate } from '../../utils/formatters';
import { Sparkles, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  booking: CleaningBooking | ShortletBooking | null;
  type: 'cleaning' | 'shortlet';
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  booking,
  type,
  onClose,
}) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCleaning = type === 'cleaning';
  const cleaningBooking = isCleaning ? (booking as CleaningBooking) : null;
  const shortletBooking = !isCleaning ? (booking as ShortletBooking) : null;

  const reference = isCleaning
    ? cleaningBooking?.reference || `LOFIX-${cleaningBooking?.id}`
    : `SHORTLET-${shortletBooking?.id}`;

  const dateFormatted = isCleaning
    ? formatDate(cleaningBooking?.scheduledAt)
    : `${formatDate(shortletBooking?.startDate)} to ${formatDate(shortletBooking?.endDate)} (${shortletBooking?.days} nights)`;

  const totalKobo = isCleaning
    ? cleaningBooking?.priceSnapshot?.total || cleaningBooking?.total || 0
    : shortletBooking?.totalCost || 0;

  const propertyAddress = isCleaning
    ? `${cleaningBooking?.propertySnapshot?.addressLine1}, ${cleaningBooking?.propertySnapshot?.city}`
    : shortletBooking?.apartment?.address || 'Lofix Property';

  const furnishing = cleaningBooking?.furnishingState || 'OCCUPIED';
  const supplies = cleaningBooking?.suppliesPreference || 'SUPPLIES_INCLUDED';
  const frequency = cleaningBooking?.frequency || 'ONE_TIME';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Payment Receipt" maxWidth="md">
      <div className="space-y-6 print:p-0">
        <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 fill-current text-white" />
              </div>
              <span className="text-lg font-extrabold font-display">Lofix</span>
            </div>
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              PAID & VERIFIED
            </Badge>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Receipt Reference</p>
              <p className="text-sm font-mono font-bold text-emerald-400">{reference}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Paid</p>
              <p className="text-xl font-black font-display text-white">{formatNaira(totalKobo)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Service Type</span>
            <span className="font-bold text-slate-900">
              {isCleaning
                ? cleaningBooking?.priceSnapshot?.serviceName || 'Home Cleaning'
                : 'Apartment Shortlet Booking'}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Scheduled Date / Stay</span>
            <span className="font-bold text-slate-900">{dateFormatted}</span>
          </div>

          {isCleaning && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-semibold">Preferences</span>
              <span className="font-bold text-slate-900 text-right">
                {furnishing} • {supplies === 'CUSTOMER_PROVIDED' ? 'Customer Supplies' : 'Supplies Included'} • {frequency}
              </span>
            </div>
          )}

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Property Address</span>
            <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
              {propertyAddress}
            </span>
          </div>

          <div className="flex justify-between pb-1">
            <span className="text-slate-500 font-semibold">Payment Gateway</span>
            <span className="font-bold text-emerald-700">Paystack NGN Inline</span>
          </div>
        </div>

        {isCleaning && cleaningBooking?.priceSnapshot && (
          <div className="space-y-2 text-xs pt-1">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Itemized Charges Snapshot
            </p>
            <div className="space-y-1.5 p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span>Base Service</span>
                <span>{formatNaira(cleaningBooking.priceSnapshot.basePrice || cleaningBooking.priceSnapshot.minimumPrice || 0)}</span>
              </div>
              {cleaningBooking.priceSnapshot.roomCharges > 0 && (
                <div className="flex justify-between">
                  <span>Room Charges</span>
                  <span>+{formatNaira(cleaningBooking.priceSnapshot.roomCharges)}</span>
                </div>
              )}
              {cleaningBooking.priceSnapshot.bathroomCharges > 0 && (
                <div className="flex justify-between">
                  <span>Bathroom Charges</span>
                  <span>+{formatNaira(cleaningBooking.priceSnapshot.bathroomCharges)}</span>
                </div>
              )}
              {cleaningBooking.priceSnapshot.floorCharges > 0 && (
                <div className="flex justify-between">
                  <span>Floor Charges</span>
                  <span>+{formatNaira(cleaningBooking.priceSnapshot.floorCharges)}</span>
                </div>
              )}

              {/* Saved Dishwashing Items Snapshot */}
              {cleaningBooking.priceSnapshot.dishwashingItems && cleaningBooking.priceSnapshot.dishwashingItems.length > 0 && (
                <div className="p-2 bg-slate-50 rounded border border-slate-200 my-1 space-y-1 text-[11px]">
                  <p className="font-bold text-slate-800 flex justify-between">
                    <span>Dishwashing Items:</span>
                    <span className="text-emerald-700">+{formatNaira(cleaningBooking.priceSnapshot.dishwashingTotal || 0)}</span>
                  </p>
                  {cleaningBooking.priceSnapshot.dishwashingItems.map((item, idx) => (
                    <div key={item.itemId || idx} className="flex justify-between text-slate-600">
                      <span>• {item.itemName || item.name || `Item #${item.itemId}`} x{item.quantity} ({item.unit || 'PIECE'})</span>
                      <span>{formatNaira(item.total || item.price || 0)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!!cleaningBooking.priceSnapshot.furnishingSurcharge && cleaningBooking.priceSnapshot.furnishingSurcharge !== 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Condition Surcharge</span>
                  <span>+{formatNaira(cleaningBooking.priceSnapshot.furnishingSurcharge)}</span>
                </div>
              )}
              {!!cleaningBooking.priceSnapshot.suppliesDiscount && cleaningBooking.priceSnapshot.suppliesDiscount !== 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Supplies Discount</span>
                  <span>{formatNaira(cleaningBooking.priceSnapshot.suppliesDiscount)}</span>
                </div>
              )}
              {!!cleaningBooking.priceSnapshot.frequencyDiscount && cleaningBooking.priceSnapshot.frequencyDiscount !== 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Frequency Discount</span>
                  <span>{formatNaira(cleaningBooking.priceSnapshot.frequencyDiscount)}</span>
                </div>
              )}
              {cleaningBooking.priceSnapshot.addonsTotal > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Add-ons Total</span>
                  <span>+{formatNaira(cleaningBooking.priceSnapshot.addonsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900">
                <span>Total Amount</span>
                <span>{formatNaira(cleaningBooking.priceSnapshot.total)}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Official Lofix Technologies Digital Transaction Document</span>
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
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
