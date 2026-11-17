import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TransactionsPage } from '../../pages/transactions/TransactionsPage';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../api/transactions', () => ({ transactionsApi: { getAdminTransactions: mocks.get } }));
vi.mock('../../components/layout/PageLayout', () => ({ PageLayout: ({children}: {children: React.ReactNode}) => <div>{children}</div> }));
function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><TransactionsPage /></MemoryRouter></QueryClientProvider>);
}
describe('transaction delivery status', () => {
  it('does not present a paid failed delivery as completed', async () => {
    mocks.get.mockResolvedValue([{id:18,reference:'TRX-18',type:'BILL',status:'COMPLETED',paymentStatus:'COMPLETED',orderStatus:'NEEDS_SUPPORT',amount:10000,createdAt:'2026-11-17',message:'Payment received, but delivery failed.'}]);
    mount();
    expect(await screen.findByText('NEEDS SUPPORT')).toBeInTheDocument();
    expect(screen.getByText('Payment: Paid')).toBeInTheDocument();
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
  });
  it('shows completion only when the order reports successful delivery', async () => {
    mocks.get.mockResolvedValue([{id:18,reference:'TRX-18',type:'BILL',status:'COMPLETED',paymentStatus:'COMPLETED',orderStatus:'COMPLETED',amount:10000,createdAt:'2026-11-17',message:'Service delivered.'}]);
    mount();
    expect(await screen.findByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Service delivered.')).toBeInTheDocument();
  });
});
