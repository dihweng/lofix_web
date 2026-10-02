import React, { useState } from 'react';
import { Input } from '../common/Input';
import { formatNaira } from '../../utils/money';
import { Search, CheckCircle2, X, Layers } from 'lucide-react';

interface VariationItem {
  variation_code: string;
  name: string;
  variation_amount: number | string;
}

interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variations: VariationItem[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({
  isOpen,
  onClose,
  title,
  variations,
  selectedCode,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredVariations = variations.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-0 max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-slate-300">Choose from available plans & packages</p>
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

        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
          <div className="sticky top-0 bg-white pb-2">
            <Input
              placeholder="Search plan or bouquet name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {filteredVariations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No matching plans found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredVariations.map((v) => {
                const isSelected = selectedCode === v.variation_code;
                const numAmt = parseFloat(String(v.variation_amount)) * 100;

                return (
                  <button
                    key={v.variation_code}
                    type="button"
                    onClick={() => {
                      onSelect(v.variation_code);
                      onClose();
                    }}
                    className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-0.5 pr-3">
                      <p className="font-bold text-xs sm:text-sm text-slate-900">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {v.variation_code}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-extrabold text-xs sm:text-sm text-emerald-700">
                        {formatNaira(numAmt)}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
