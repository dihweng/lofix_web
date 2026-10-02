import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { CleaningBooking } from '../../api/bookings';
import { Star, Sparkles, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  booking: CleaningBooking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [professionalismRating, setProfessionalismRating] = useState<number>(5);
  const [comment, setComment] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);

    try {
      await cleaningCustomerApi.submitReview(booking.id, {
        rating,
        cleanlinessRating,
        punctualityRating,
        professionalismRating,
        comment: comment.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to submit review.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 fill-slate-100'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Post-Service Review #${booking.reference || booking.id}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Overall Rating
          </p>
          <div className="flex justify-center">
            {renderStars(rating, setRating)}
          </div>
          <span className="text-xs font-semibold text-emerald-700 block">
            {rating === 5
              ? 'Excellent Service!'
              : rating >= 4
              ? 'Very Good'
              : rating >= 3
              ? 'Satisfactory'
              : 'Needs Improvement'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-bold text-slate-800 text-sm">Cleanliness</span>
            <div className="flex justify-center sm:justify-end">
              {renderStars(cleanlinessRating, setCleanlinessRating)}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-bold text-slate-800 text-sm">Punctuality</span>
            <div className="flex justify-center sm:justify-end">
              {renderStars(punctualityRating, setPunctualityRating)}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-bold text-slate-800 text-sm">Agent Conduct</span>
            <div className="flex justify-center sm:justify-end">
              {renderStars(professionalismRating, setProfessionalismRating)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Comments & Feedback
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with the cleaning team..."
            className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
