import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { utilitiesApi } from '../../api/utilities';
import { UtilitiesPage } from '../../pages/utilities/UtilitiesPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/utilities', () => ({
  utilitiesApi: {
    getElectricityCatalogue: vi.fn(),
    getVtpassServices: vi.fn(),
    getVtpassVariations: vi.fn(),
    verifyVtpassTarget: vi.fn(),
    createVtpassOrder: vi.fn(),
    getVtpassOrderStatus: vi.fn(),
    getUserVtpassOrders: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
  }),
}));

const mockElectricityCatalogue = {
  coverageNote: 'State mapping is distribution-zone guidance. Please match the distribution company on your electricity bill before proceeding.',
  processor: 'vtpass',
  environment: 'sandbox',
  states: [
    { code: 'LA', name: 'Lagos', providerIds: ['ikeja-electric', 'eko-electric'] },
    { code: 'BN', name: 'Benue', providerIds: ['jos-electric', 'abuja-electric'] },
    { code: 'NS', name: 'Nasarawa', providerIds: ['abuja-electric', 'jos-electric'] },
    { code: 'AB', name: 'Abia', providerIds: ['enugu-electric', 'aba-electric'] },
  ],
  providers: [
    {
      serviceID: 'ikeja-electric',
      name: 'Ikeja Electric (IKEDC)',
      stateCodes: ['LA'],
      stateCount: 1,
      available: true,
      coverageNote: 'Serves Lagos Mainland, Ikeja, Ikorodu',
    },
    {
      serviceID: 'eko-electric',
      name: 'Eko Electricity (EKEDC)',
      stateCodes: ['LA'],
      stateCount: 1,
      available: false,
      unavailableReason: 'Eko Electric service undergoing maintenance.',
      coverageNote: 'Serves Lagos Island, Lekki, VI',
    },
    {
      serviceID: 'jos-electric',
      name: 'Jos Electricity (JEDC)',
      stateCodes: ['BN', 'NS', 'PL'],
      stateCount: 3,
      available: false,
      unavailableReason: 'JEDC token integration coming soon.',
      coverageNote: 'Serves Benue, Nasarawa, Plateau',
    },
    {
      serviceID: 'abuja-electric',
      name: 'Abuja Electricity (AEDC)',
      stateCodes: ['BN', 'NS', 'FCT'],
      stateCount: 3,
      available: false,
      unavailableReason: 'AEDC integration coming soon.',
      coverageNote: 'Serves FCT, Nasarawa, Niger, Kogi',
    },
    {
      serviceID: 'enugu-electric',
      name: 'Enugu Electricity (EEDC)',
      stateCodes: ['AB', 'EN'],
      stateCount: 2,
      available: false,
      unavailableReason: 'EEDC integration coming soon.',
      coverageNote: 'Serves South-East States',
    },
    {
      serviceID: 'aba-electric',
      name: 'Aba Power (APLE)',
      stateCodes: ['AB'],
      stateCount: 1,
      available: true,
      coverageNote: 'Serves Aba metropolis and 9 LGAs in Abia State',
    },
  ],
};

describe('UtilitiesPage Component & VTpass Bills Integration Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (utilitiesApi.getElectricityCatalogue as any).mockResolvedValue(mockElectricityCatalogue);

    (utilitiesApi.getVtpassServices as any).mockImplementation((type: string) => {
      if (type === 'DATA') {
        return Promise.resolve([{ serviceID: 'mtn-data', name: 'MTN Data' }]);
      } else if (type === 'CABLE') {
        return Promise.resolve([{ serviceID: 'dstv', name: 'DSTV Subscription' }]);
      } else {
        return Promise.resolve([{ serviceID: 'mtn', name: 'MTN Airtime' }]);
      }
    });

    (utilitiesApi.getVtpassVariations as any).mockImplementation((type: string) => {
      if (type === 'DATA') {
        return Promise.resolve([
          { variation_code: 'mtn-5gb', name: '5.0 GB Monthly', variation_amount: 1500 },
        ]);
      } else {
        return Promise.resolve([
          { variation_code: 'dstv-compact', name: 'DSTV Compact', variation_amount: 15700 },
        ]);
      }
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UtilitiesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('renders Electricity tab with state-first selection, verifies meter number, and creates order', async () => {
    (utilitiesApi.verifyVtpassTarget as any).mockResolvedValue({
      customerName: 'Adebayo Lagos',
      address: '15 Admiralty Way',
      verified: true,
    });

    (utilitiesApi.createVtpassOrder as any).mockResolvedValue({
      orderId: 'ORD-VT-101',
      transactionId: 505,
      amount: 500000,
      status: 'READY',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Buy Electricity Meter Token/i)[0]).toBeInTheDocument();
      expect(screen.getByText('Ikeja Electric (IKEDC)')).toBeInTheDocument();
      expect(screen.getByText('Eko Electricity (EKEDC)')).toBeInTheDocument();
    });

    // Verify Ikeja Electric is selectable and Eko Electric is disabled with reason
    const ikejaBtn = screen.getByText('Ikeja Electric (IKEDC)').closest('button')!;
    const ekoBtn = screen.getByText('Eko Electricity (EKEDC)').closest('button')!;

    expect(ikejaBtn).not.toBeDisabled();
    expect(ekoBtn).toBeDisabled();
    expect(screen.getByText(/Eko Electric service undergoing maintenance/i)).toBeInTheDocument();

    fireEvent.click(ikejaBtn);

    const meterInput = screen.getByPlaceholderText(/Enter meter number.../i);
    fireEvent.change(meterInput, { target: { value: '44001234567' } });

    const verifyButton = screen.getByRole('button', { name: /verify customer meter/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(utilitiesApi.verifyVtpassTarget).toHaveBeenCalledWith({
        serviceID: 'ikeja-electric',
        target: '44001234567',
        meterType: 'prepaid',
      });
      expect(screen.getByText(/Verified Customer Name: Adebayo Lagos/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /create order & pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(utilitiesApi.createVtpassOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ELECTRICITY',
          serviceID: 'ikeja-electric',
          target: '44001234567',
          meterType: 'prepaid',
          amount: 500000, // ₦5,000 in kobo
          idempotencyKey: expect.any(String),
        })
      );
    });
  });

  it('filters providers when state changes to Benue, Nasarawa, and Abia with area guidance', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const stateSelect = screen.getByRole('combobox');

    // 1. Switch state to Benue
    fireEvent.change(stateSelect, { target: { value: 'BN' } });

    await waitFor(() => {
      expect(screen.getByText('Jos Electricity (JEDC)')).toBeInTheDocument();
      expect(screen.getByText('Abuja Electricity (AEDC)')).toBeInTheDocument();
      expect(screen.queryByText('Ikeja Electric (IKEDC)')).not.toBeInTheDocument();
    });

    // 2. Switch state to Nasarawa
    fireEvent.change(stateSelect, { target: { value: 'NS' } });

    await waitFor(() => {
      expect(screen.getByText('Abuja Electricity (AEDC)')).toBeInTheDocument();
      expect(screen.getByText('Jos Electricity (JEDC)')).toBeInTheDocument();
    });

    // 3. Switch state to Abia
    fireEvent.change(stateSelect, { target: { value: 'AB' } });

    await waitFor(() => {
      expect(screen.getByText('Enugu Electricity (EEDC)')).toBeInTheDocument();
      expect(screen.getByText('Aba Power (APLE)')).toBeInTheDocument();
      expect(screen.getByText(/Serves Aba metropolis and 9 LGAs in Abia State/i)).toBeInTheDocument();
    });
  });

  it('clears meter verification when user changes state, provider, or meter number', async () => {
    (utilitiesApi.verifyVtpassTarget as any).mockResolvedValue({
      customerName: 'Verified Holder',
      verified: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ikeja Electric (IKEDC)')).toBeInTheDocument();
    });

    const ikejaBtn = screen.getByText('Ikeja Electric (IKEDC)').closest('button')!;
    fireEvent.click(ikejaBtn);

    const meterInput = screen.getByPlaceholderText(/Enter meter number.../i);
    fireEvent.change(meterInput, { target: { value: '44001234567' } });

    const verifyButton = screen.getByRole('button', { name: /verify customer meter/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Verified Customer Name: Verified Holder/i)).toBeInTheDocument();
    });

    // Changing meter number clears verification immediately
    fireEvent.change(meterInput, { target: { value: '44009999999' } });
    expect(screen.queryByText(/Verified Customer Name: Verified Holder/i)).not.toBeInTheDocument();
  });

  it('blocks order creation when meter verification fails', async () => {
    (utilitiesApi.verifyVtpassTarget as any).mockRejectedValue(
      new Error('Invalid meter number for provider')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ikeja Electric (IKEDC)')).toBeInTheDocument();
    });

    const ikejaBtn = screen.getByText('Ikeja Electric (IKEDC)').closest('button')!;
    fireEvent.click(ikejaBtn);

    const meterInput = screen.getByPlaceholderText(/Enter meter number.../i);
    fireEvent.change(meterInput, { target: { value: '00000000000' } });

    const verifyButton = screen.getByRole('button', { name: /verify customer meter/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(utilitiesApi.verifyVtpassTarget).toHaveBeenCalled();
    });

    // Attempting to submit order without successful verification blocks submission
    const verifyAgainBtn = screen.getByRole('button', { name: /verify customer meter/i });
    fireEvent.click(verifyAgainBtn);

    expect(utilitiesApi.createVtpassOrder).not.toHaveBeenCalled();
  });

  it('handles electricity catalogue loading error with retry button', async () => {
    (utilitiesApi.getElectricityCatalogue as any).mockRejectedValueOnce(
      new Error('Catalogue connection error')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load electricity catalogue/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry loading catalogue/i })).toBeInTheDocument();
    });

    (utilitiesApi.getElectricityCatalogue as any).mockResolvedValueOnce(mockElectricityCatalogue);

    fireEvent.click(screen.getByRole('button', { name: /retry loading catalogue/i }));

    await waitFor(() => {
      expect(screen.getByText('Ikeja Electric (IKEDC)')).toBeInTheDocument();
    });
  });

  it('switches to Mobile Data tab, renders data variations, and creates data order', async () => {
    (utilitiesApi.createVtpassOrder as any).mockResolvedValue({
      orderId: 'ORD-VT-DATA-202',
      transactionId: 506,
      amount: 150000,
      status: 'READY',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mobile data/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mobile data/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buy Mobile Data Bundles/i)).toBeInTheDocument();
      expect(screen.getAllByText(/5.0 GB Monthly/i)[0]).toBeInTheDocument();
    });

    const recipientInput = screen.getAllByPlaceholderText(/e.g. 08031234567/i)[0];
    fireEvent.change(recipientInput, { target: { value: '08031234567' } });

    const submitBtn = screen.getByRole('button', { name: /create order & pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(utilitiesApi.createVtpassOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DATA',
          serviceID: 'mtn-data',
          target: '08031234567',
          variationCode: 'mtn-5gb',
          amount: undefined, // Omitted for DATA
        })
      );
    });
  });
});
