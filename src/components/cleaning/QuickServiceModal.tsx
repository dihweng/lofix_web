import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { formatNaira } from '../../utils/money';
import { cleaningCustomerApi, DishwashingItem } from '../../api/cleaningCustomer';
import { Sparkles, Clock, MapPin, Phone, ShieldAlert, Plus, Minus, UtensilsCrossed } from 'lucide-react';

interface QuickServiceModalProps {
  isOpen: boolean;
  serviceType: 'dishwashing' | 'laundry';
  onClose: () => void;
}

export const QuickServiceModal: React.FC<QuickServiceModalProps> = ({
  isOpen,
  serviceType,
  onClose,
}) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedDishwashingQuantities, setSelectedDishwashingQuantities] = useState<Record<number, number>>({});
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Fetch Dishwashing Catalogue if serviceType is dishwashing
  const {
    data: dishwashingCatalogue = [],
    isLoading: isDishwashingLoading,
  } = useQuery({
    queryKey: ['quickServiceDishwashingCatalogue'],
    queryFn: () => cleaningCustomerApi.getDishwashingItems(),
    enabled: isOpen && serviceType === 'dishwashing',
  });

  if (!isOpen) return null;

  const title =
    serviceType === 'dishwashing'
      ? 'Dishwashing-Only Home Service'
      : 'Quick Laundry Wash & Spin Service';

  const handleDishwashingQuantityChange = (itemId: number, delta: number) => {
    setSelectedDishwashingQuantities((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.min(1000, Math.max(0, current + delta));
      return { ...prev, [itemId]: updated };
    });
  };

  // Calculate total price
  let totalPrice = 0;
  if (serviceType === 'laundry') {
    totalPrice = 5000 * Math.max(1, quantity);
  } else {
    // Sum dishwashing items
    const itemsTotal = dishwashingCatalogue.reduce((sum, item) => {
      const qty = selectedDishwashingQuantities[item.id] || 0;
      return sum + Number(item.price) * qty;
    }, 0);
    totalPrice = itemsTotal > 0 ? itemsTotal : 3500; // Minimum base charge if 0 items selected
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowComingSoon(true);
    }, 800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      <div className="space-y-6">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="space-y-1">
            <Badge variant="success" size="sm">Quick Home Service</Badge>
            <p className="font-bold text-emerald-900 mt-1">
              {serviceType === 'dishwashing'
                ? 'Configure exact kitchen utensils and cookware for professional dishwashing.'
                : 'We wash and spin-dry your clothes at your home (no waiting for all-day sun drying; you pick, hang, and fold yourself).'}
            </p>
          </div>
          <div className="text-right flex-shrink-0 pl-3">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Estimated Quote</p>
            <p className="text-xl font-black text-emerald-700 font-display">{formatNaira(totalPrice)}</p>
          </div>
        </div>

        {showComingSoon ? (
          <div className="p-6 bg-amber-50 border border-amber-300 rounded-2xl text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
            <h4 className="text-base font-extrabold text-amber-950 font-display">Coming Soon!</h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Standalone <strong>{title}</strong> is currently in preview demo mode and bound to future release. Online payment is not active for this quick service yet.
            </p>
            <Button variant="primary" size="md" className="w-full font-bold mt-2" onClick={onClose}>
              Got It, Close Modal
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {serviceType === 'laundry' ? (
              <Input
                label="Laundry Load Quantity (Baskets)"
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                required
              />
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" /> Configure Kitchen Utensils & Cookware (Select Items)
                </label>
                {isDishwashingLoading ? (
                  <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
                ) : dishwashingCatalogue.length === 0 ? (
                  <div className="p-4 bg-slate-50 border rounded-xl text-xs text-slate-500 text-center">
                    No dishwashing items found in catalogue.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
                    {dishwashingCatalogue.map((item: DishwashingItem) => {
                      const qty = selectedDishwashingQuantities[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all gap-3 ${
                            qty > 0 ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 leading-tight">{item.name}</span>
                              <Badge variant="info" size="sm">{item.unit}</Badge>
                            </div>
                            <p className="text-xs font-extrabold text-emerald-700 pt-1">
                              {formatNaira(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 font-medium">Quantity:</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDishwashingQuantityChange(item.id, -1)}
                                disabled={qty === 0}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-black text-slate-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDishwashingQuantityChange(item.id, 1)}
                                disabled={qty >= 1000}
                                className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Input
              label="Service Delivery Address"
              placeholder="e.g. 15 Admiralty Way, Lekki Phase 1, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Phone Number"
                placeholder="e.g. 08031234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-md"
                isLoading={isSubmitting}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Proceed to Checkout ({formatNaira(totalPrice)})
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
