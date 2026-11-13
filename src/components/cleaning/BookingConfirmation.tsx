import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CleaningBooking } from '../../api/bookings';

interface Props {
  booking: CleaningBooking;
  firstName: string;
  fullName: string;
  onContinue: () => void;
  onClose: () => void;
}

export const BookingConfirmation: React.FC<Props> = ({ booking, firstName, fullName, onContinue, onClose }) => {
  const submitted = booking.createdAt ? new Date(booking.createdAt) : null;
  return (
    <Modal isOpen onClose={onClose} title={`Phew, your booking went through, ${firstName}!`} maxWidth="lg">
      <div className="space-y-5 text-sm text-slate-600">
        <p className="text-lg font-semibold text-emerald-700">We'll be sweeping your floors in no time.</p>
        <p>{fullName}, we've successfully received your online booking. You can review the full details in My Bookings, and we'll get to work on assigning an available cleaner.</p>
        <p>Lofix handles all cleaner interviews, vetting and approval. Our admin team will assign an approved cleaner and update your booking when the assignment is accepted.</p>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
          <p className="font-semibold text-slate-900">Your reference number</p>
          <p className="font-mono text-lg text-emerald-800 break-all">{booking.reference || `Booking #${booking.id}`}</p>
          {submitted && !Number.isNaN(submitted.getTime()) && <p>Submitted on {submitted.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'short', timeStyle: 'short' })} (WAT)</p>}
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900">Contact details</h4>
          <p>If you need to get in contact with your local office, please use the details below:</p>
          <p className="font-medium">Lofix Clean Masters &amp; General Ltd</p>
          <a className="block text-emerald-700 underline" href="tel:+2349099474330">0909 947 4330</a>
          <a className="block text-emerald-700 underline" href="mailto:support@lofix.ng">support@lofix.ng</a>
        </div>
        <p className="text-xs text-slate-500">{booking.paymentTiming === 'AFTER_COMPLETION' ? 'Your booking is confirmed. Payment is due after the cleaning is completed. You can also choose to pay now.' : 'Your booking has been received. Payment is still pending.'}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onContinue}>{booking.paymentTiming === 'AFTER_COMPLETION' ? 'Pay now' : 'Continue to payment'}</Button>
          <Button variant="outline" onClick={onClose}>{booking.paymentTiming === 'AFTER_COMPLETION' ? 'Pay after completion — view booking' : 'View my bookings'}</Button>
        </div>
      </div>
    </Modal>
  );
};
