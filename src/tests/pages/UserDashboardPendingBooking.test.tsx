import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { UserDashboardPage } from '../../pages/dashboard/UserDashboardPage';

const mocks = vi.hoisted(() => ({
  getCleaningBookings: vi.fn(),
  cancelCleaningBooking: vi.fn(),
  getShortletBookings: vi.fn(),
  getUserEnquiries: vi.fn(),
  getUtilityOrders: vi.fn(),
}));

vi.mock('../../api/cleaningCustomer', () => ({
  cleaningCustomerApi: {
    getCustomerBookings: mocks.getCleaningBookings,
    cancelBooking: mocks.cancelCleaningBooking,
  },
}));
vi.mock('../../api/shortletCustomer', () => ({
  shortletCustomerApi: { getCustomerBookings: mocks.getShortletBookings },
}));
vi.mock('../../api/propertyListings', () => ({
  propertyListingsApi: { getUserEnquiries: mocks.getUserEnquiries },
}));
vi.mock('../../api/utilities', () => ({
  utilitiesApi: { getUserVtpassOrders: mocks.getUtilityOrders },
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, firstName: 'Ada', lastName: 'Customer', email: 'ada@example.com', phoneNumber: '08000000000' },
    isAuthenticated: true,
    updateProfile: vi.fn(),
    refreshUser: vi.fn(),
    completePhoneVerification: vi.fn(),
  }),
}));
vi.mock('../../components/layout/CustomerLayout', () => ({
  CustomerLayout: ({
    children,
    toasts = [],
  }: {
    children: React.ReactNode;
    toasts?: Array<{ id: string; message: string }>;
  }) => (
    <div>
      {children}
      {toasts.map((toast) => <div key={toast.id}>{toast.message}</div>)}
    </div>
  ),
}));
vi.mock('../../components/payment/PaymentModal', () => ({
  PaymentModal: ({ isOpen, transactionId }: { isOpen: boolean; transactionId: number | null }) =>
    isOpen ? <div role="dialog">Payment transaction {transactionId}</div> : null,
}));
vi.mock('../../components/cleaning/LiveJobTrackingModal', () => ({ LiveJobTrackingModal: () => null }));
vi.mock('../../components/cleaning/ReviewModal', () => ({ ReviewModal: () => null }));
vi.mock('../../components/support/SupportTicketModal', () => ({ SupportTicketModal: () => null }));
vi.mock('../../components/utilities/ElectricityReceiptModal', () => ({ ElectricityReceiptModal: () => null }));

const pendingBooking = {
  id: 17,
  reference: 'CLN-17',
  accountId: 1,
  propertyId: 9,
  serviceId: 3,
  transactionId: 241,
  scheduledAt: '2026-11-10T09:00:00.000Z',
  status: 'PAYMENT_PENDING' as const,
  total: 2500000,
  currency: 'NGN',
  propertySnapshot: {
    id: 9,
    name: 'Home',
    propertyTypeId: 1,
    addressLine1: '12 Example Street',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    numberOfBathrooms: 2,
    numberOfFloors: 1,
  },
  priceSnapshot: { total: 2500000, serviceName: 'Standard Cleaning' },
};

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/?tab=bookings']}>
        <UserDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('pending cleaning bookings in My Bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCleaningBookings.mockResolvedValue([pendingBooking]);
    mocks.cancelCleaningBooking.mockResolvedValue({ ...pendingBooking, status: 'CANCELLED' });
    mocks.getShortletBookings.mockResolvedValue([]);
    mocks.getUserEnquiries.mockResolvedValue([]);
    mocks.getUtilityOrders.mockResolvedValue([]);
  });

  it('lets the customer resume payment using the booking transaction', async () => {
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Complete Payment' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Payment transaction 241');
  });

  it('lets the customer cancel an unpaid request with a reason', async () => {
    mocks.getCleaningBookings
      .mockResolvedValueOnce([pendingBooking])
      .mockResolvedValueOnce([{ ...pendingBooking, status: 'CANCELLED' }]);
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel Request' }));
    fireEvent.change(await screen.findByRole('textbox', { name: /Cancellation Reason/ }), {
      target: { value: 'I selected the wrong date' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Booking' }));

    await waitFor(() => {
      expect(cleaningCustomerApi.cancelBooking).toHaveBeenCalledWith(17, 'I selected the wrong date');
    });
    expect(await screen.findByText('Cleaning request cancelled.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Cancel Request' })).not.toBeInTheDocument();
    });
  });

  it('does not present live tracking before payment is completed', async () => {
    renderDashboard();

    expect(await screen.findByRole('button', { name: 'Complete Payment' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Track Live' })).not.toBeInTheDocument();
  });

  it('shows review state per completed booking and does not offer a duplicate review', async () => {
    mocks.getCleaningBookings.mockResolvedValue([
      { ...pendingBooking, id: 18, status: 'COMPLETED', hasReview: true },
      { ...pendingBooking, id: 19, status: 'COMPLETED', hasReview: false },
    ]);
    renderDashboard();

    expect(await screen.findByText('Reviewed')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Leave Review' })).toHaveLength(1);
  });
});
