import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  offset: number;
  limit: number;
  totalCountOnPage: number;
  onOffsetChange: (newOffset: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  offset,
  limit,
  totalCountOnPage,
  onOffsetChange,
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const hasNext = totalCountOnPage >= limit;
  const hasPrev = offset > 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl mt-4">
      <div className="text-xs text-slate-500">
        Showing items <span className="font-semibold text-slate-700">{offset + 1}</span> to{' '}
        <span className="font-semibold text-slate-700">{offset + totalCountOnPage}</span> (Page {currentPage})
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onOffsetChange(offset + limit)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
