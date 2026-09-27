import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { CleaningCalculatorPage } from '../../pages/cleaning/CleaningCalculatorPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/cleaningCustomer', () => ({
  cleaningCustomerApi: {
    getServices: vi.fn(),
    getPropertyTypes: vi.fn(),
    getAddons: vi.fn(),
    getSavedProperties: vi.fn(),
    calculateQuote: vi.fn(),
    updateSavedProperty: vi.fn(),
    createBooking: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
  }),
}));

describe('CleaningCalculatorPage Room-Based Pricing & Auto-Save Logic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (cleaningCustomerApi.getServices as any).mockResolvedValue([
      { id: 1, name: 'Standard Cleaning', description: 'Basic clean', estimatedDurationMinutes: 120 },
    ]);
    (cleaningCustomerApi.getPropertyTypes as any).mockResolvedValue([
      { id: 1, name: 'Flat / Apartment' },
    ]);
    (cleaningCustomerApi.getAddons as any).mockResolvedValue([
      { id: 10, name: 'Oven Degreasing', price: 150000 },
    ]);
    (cleaningCustomerApi.getSavedProperties as any).mockResolvedValue([
      {
        id: 4,
        name: 'My Lekki Flat',
        propertyTypeId: 1,
        addressLine1: '12 Admiralty Way',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        numberOfBedrooms: 3,
        numberOfLivingRooms: 2,
        numberOfBathrooms: 2,
        numberOfFloors: 1,
        squareMeters: null,
      },
    ]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CleaningCalculatorPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('calculates quote for 3 bedrooms + 2 parlours (5 rooms total) and null area', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 500000, // 5 rooms
      bathroomCharges: 200000,
      floorCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      furnishingSurcharge: 0,
      suppliesDiscount: 0,
      frequencyDiscount: 0,
      serviceFee: 50000,
      total: 1250000,
      serviceName: 'Standard Cleaning',
      estimatedDurationMinutes: 200,
      recommendedCleaners: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(cleaningCustomerApi.calculateQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          numberOfBedrooms: 3,
          numberOfLivingRooms: 2,
          squareMeters: null,
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Room Charges \(3 beds \+ 2 parlours = 5 rooms\)/i)
      ).toBeInTheDocument();
    });
  });

  it('auto-saves updated dimensions to property before creating booking', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 500000,
      bathroomCharges: 200000,
      floorCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      furnishingSurcharge: 0,
      suppliesDiscount: 0,
      frequencyDiscount: 0,
      serviceFee: 50000,
      total: 1250000,
      serviceName: 'Standard Cleaning',
      estimatedDurationMinutes: 200,
      recommendedCleaners: 2,
    });

    (cleaningCustomerApi.updateSavedProperty as any).mockResolvedValue({
      id: 4,
      name: 'My Lekki Flat',
    });

    (cleaningCustomerApi.createBooking as any).mockResolvedValue({
      id: 99,
      transactionId: 202,
      total: 1250000,
      status: 'PAYMENT_PENDING',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/My Lekki Flat/i)).toBeInTheDocument();
    });

    const bookButton = screen.getByRole('button', { name: /book & proceed to checkout/i });
    expect(bookButton).not.toBeDisabled();

    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(cleaningCustomerApi.createBooking).toHaveBeenCalledWith({
        propertyId: 4,
        serviceId: 1,
        scheduledAt: expect.any(String),
        furnishingState: 'OCCUPIED',
        suppliesPreference: 'SUPPLIES_INCLUDED',
        frequency: 'ONE_TIME',
        customerNote: '',
        addons: [],
      });
    });
  });

  it('handles legacy total-only properties by prompting for breakdown', async () => {
    (cleaningCustomerApi.getSavedProperties as any).mockResolvedValue([
      {
        id: 7,
        name: 'Legacy Victoria Island Flat',
        propertyTypeId: 1,
        addressLine1: '8 Ozumba Mbadiwe',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        numberOfRooms: 4, // Legacy total
        numberOfBathrooms: 2,
        numberOfFloors: 1,
        squareMeters: null,
      },
    ]);

    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 400000,
      bathroomCharges: 200000,
      floorCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      serviceFee: 50000,
      total: 1150000,
      serviceName: 'Standard Cleaning',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Selected property has a legacy room total \(4 rooms\)/i)).toBeInTheDocument();
    });
  });
});
