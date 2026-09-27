import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { utilitiesApi } from '../../api/utilities';
import { UtilitiesPage } from '../../pages/utilities/UtilitiesPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/utilities', () => ({
  utilitiesApi: {
    getElectricityDiscos: vi.fn(),
    verifyMeterNumber: vi.fn(),
    getDataPlans: vi.fn(),
    getCableTvPackages: vi.fn(),
    verifySmartcardNumber: vi.fn(),
    purchaseUtility: vi.fn(),
    getUserUtilityTransactions: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
  }),
}));

describe('UtilitiesPage Component & Utility Payment Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (utilitiesApi.getElectricityDiscos as any).mockResolvedValue([
      { id: 'IKEDC', name: 'Ikeja Electric (IKEDC)', shortCode: 'Ikeja', statesServed: ['Lagos'] },
      { id: 'EKEDC', name: 'Eko Electricity (EKEDC)', shortCode: 'Eko', statesServed: ['Lagos'] },
    ]);

    (utilitiesApi.getDataPlans as any).mockResolvedValue([
      { id: 'MTN-5GB', network: 'MTN', name: 'MTN 5GB Monthly', allowance: '5GB', validity: '30 Days', price: 150000 },
    ]);

    (utilitiesApi.getCableTvPackages as any).mockResolvedValue([
      { id: 'DSTV-COMPACT', provider: 'DSTV', name: 'DSTV Compact', price: 1570000, description: 'Over 130 channels' },
    ]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UtilitiesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('renders utility tabs and verifies meter number in Electricity tab', async () => {
    (utilitiesApi.verifyMeterNumber as any).mockResolvedValue({
      meterNumber: '44001234567',
      customerName: 'Adebayo Lagos',
      disco: 'IKEDC',
      meterType: 'prepaid',
      verified: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Buy Electricity Meter Token/i)).toBeInTheDocument();
      expect(screen.getByText('Ikeja')).toBeInTheDocument();
    });

    const meterInput = screen.getByPlaceholderText(/Enter your 10-13 digit meter number/i);
    fireEvent.change(meterInput, { target: { value: '44001234567' } });

    const verifyButton = screen.getByRole('button', { name: /verify meter/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(utilitiesApi.verifyMeterNumber).toHaveBeenCalledWith('IKEDC', '44001234567', 'prepaid');
      expect(screen.getByText(/Verified Customer: Adebayo Lagos/i)).toBeInTheDocument();
    });
  });

  it('switches to Mobile Data tab and displays data bundles', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Mobile Data/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mobile data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buy Mobile Data Bundles/i)).toBeInTheDocument();
      expect(screen.getByText(/MTN 5GB Monthly/i)).toBeInTheDocument();
      expect(screen.getAllByText(/₦1,500.00/i)[0]).toBeInTheDocument();
    });
  });

  it('submits utility purchase payload and triggers payment modal', async () => {
    (utilitiesApi.purchaseUtility as any).mockResolvedValue({
      transactionId: 303,
      reference: 'UTIL-303-REF',
      message: 'Transaction initialized',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Buy Electricity Meter Token/i)).toBeInTheDocument();
    });

    const meterInput = screen.getByPlaceholderText(/Enter your 10-13 digit meter number/i);
    fireEvent.change(meterInput, { target: { value: '44001234567' } });

    const submitBtn = screen.getByRole('button', { name: /pay & instant token \/ top-up/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(utilitiesApi.purchaseUtility).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ELECTRICITY',
          providerId: 'IKEDC',
          accountNumber: '44001234567',
          amount: 500000, // ₦5,000 in kobo
        })
      );
    });
  });
});
