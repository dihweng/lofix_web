import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ShortletQuoteSummary } from '../../components/listings/ShortletQuoteSummary';

it('uses authoritative breakdown amounts and converts kobo to NGN once', () => {
  render(<ShortletQuoteSummary quote={{
    startDate: '2026-10-22', endDate: '2026-10-23', guests: 2, nights: 1,
    nightlyPrice: 999999, cleaningFee: 999999, cautionFee: 999999,
    breakdown: { accommodationTotal: 100000, cleaningFee: 20000, cautionFee: 30000 },
    total: 150000,
  }} />);
  expect(screen.getByText('Accommodation Total (1 Night)')).toBeInTheDocument();
  for (const amount of ['₦1,000.00', '₦200.00', '₦300.00', '₦1,500.00']) {
    expect(screen.getByText(amount)).toBeInTheDocument();
  }
  expect(screen.getByText('Caution Deposit')).toBeInTheDocument();
});

it('shows zero fees from breakdown instead of legacy fees', () => {
  render(<ShortletQuoteSummary quote={{
    startDate: '2026-10-22', endDate: '2026-10-23', guests: 2, nights: 1,
    cleaningFee: 50000, cautionFee: 50000,
    breakdown: { accommodationTotal: 100000, cleaningFee: 0, cautionFee: 0 },
    total: 100000,
  }} />);
  expect(screen.getAllByText('₦0.00')).toHaveLength(2);
});
