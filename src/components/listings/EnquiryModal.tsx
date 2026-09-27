import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { propertyListingsApi, PropertyListing } from '../../api/propertyListings';
import { formatNaira } from '../../utils/money';
import { Send, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface EnquiryModalProps {
  isOpen: boolean;
  listing: PropertyListing | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  listing,
  onClose,
  onSuccess,
}) => {
  const [message, setMessage] = useState(
    'Hello, I am interested in this property listing. Please contact me with more information.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  if (!listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await propertyListingsApi.submitEnquiry(listing.id, message.trim());
      setIsSent(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setIsSent(false);
      }, 1500);
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.data?.message?.includes('already')) {
        setIsSent(true);
        setErrorMsg('You have already submitted an enquiry for this property.');
      } else {
        setErrorMsg(
          err.response?.data?.message || err.message || 'Failed to submit enquiry. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedPrice = formatNaira(listing.price);
  const periodText = listing.pricePeriod ? `/ ${listing.pricePeriod}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Property Enquiry: ${listing.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSent && !errorMsg ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Enquiry Submitted!</h3>
            <p className="text-xs text-emerald-700">
              Your enquiry has been received. The property owner/agent will contact you shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Listing Snapshot Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {listing.purpose}
                </span>
                <span className="text-slate-400">{listing.propertyType}</span>
              </div>
              <h4 className="font-bold text-sm text-white">{listing.title}</h4>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{listing.address}</span>
              </p>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Offer Price</span>
                <span className="text-xl font-black text-emerald-400 font-display">
                  {formattedPrice} <span className="text-xs text-slate-400 font-normal">{periodText}</span>
                </span>
              </div>
            </div>

            {/* Message input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Message / Questions
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about inspection schedules, lease terms, or property availability..."
                className="block w-full rounded-xl border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Enquiry
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
