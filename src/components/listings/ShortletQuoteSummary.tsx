import { ShortletQuoteResponse } from '../../api/propertyListings';
import { formatNaira } from '../../utils/money';

export const ShortletQuoteSummary = ({ quote }: { quote: ShortletQuoteResponse }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
    <div className="flex justify-between text-slate-600">
      <span>Accommodation Total ({quote.nights} {quote.nights === 1 ? 'Night' : 'Nights'})</span>
      <span>{formatNaira(quote.breakdown?.accommodationTotal ?? (quote.nightlyPrice ?? 0) * quote.nights)}</span>
    </div>
    <div className="flex justify-between text-slate-600">
      <span>Cleaning Fee</span>
      <span>{formatNaira(quote.breakdown?.cleaningFee ?? quote.cleaningFee ?? 0)}</span>
    </div>
    <div className="flex justify-between text-slate-600">
      <span>Caution Deposit</span>
      <span>{formatNaira(quote.breakdown?.cautionFee ?? quote.cautionFee ?? 0)}</span>
    </div>
    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
      <span>Total Amount</span>
      <span className="text-emerald-700">{formatNaira(quote.total)}</span>
    </div>
  </div>
);
