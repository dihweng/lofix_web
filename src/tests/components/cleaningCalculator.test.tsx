import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    getDishwashingItems: vi.fn(),
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

describe('CleaningCalculatorPage Room-Based Pricing & Dishwashing Catalogue Flow', () => {
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
    (cleaningCustomerApi.getDishwashingItems as any).mockResolvedValue([
      { id: 101, name: 'Glass Cups', description: 'Fragile drinkware', price: 50000, unit: 'PIECE', active: true },
      { id: 102, name: '6-Piece Dinner Set', description: 'Complete dinnerware set', price: 200000, unit: 'SET', active: true },
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

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CleaningCalculatorPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  const renderComponent = async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Standard Cleaning|Post-Construction Cleaning/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Flat / Apartment' }));
    fireEvent.click(await screen.findByRole('button', { name: /My Lekki Flat|Legacy Victoria Island Flat/ }));
  };

  it('does not request or show a quote until the customer selects and confirms a configuration', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 0,
      bathroomCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      serviceFee: 0,
      total: 500000,
      serviceName: 'Standard Cleaning',
    });

    renderPage();
    expect(await screen.findByText(/Choose a cleaning service and property type/i)).toBeInTheDocument();
    expect(cleaningCustomerApi.calculateQuote).not.toHaveBeenCalled();
    expect(screen.queryByText('Total Price')).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Standard Cleaning/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Flat / Apartment' }));
    expect(cleaningCustomerApi.calculateQuote).not.toHaveBeenCalled();
    expect(screen.queryByText('Total Price')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Use these room counts/ }));
    await waitFor(() => expect(cleaningCustomerApi.calculateQuote).toHaveBeenCalled());
    expect(await screen.findByText('Total Price')).toBeInTheDocument();
  });

  it('calculates quote for 3 bedrooms + 2 parlours (5 rooms total) and null area', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      pricePerRoom: 100000,
      pricePerBathroom: 100000,
      roomCharges: 500000, // 5 rooms
      bathroomCharges: 200000,
      sqMeterCharges: 0,
      addonsTotal: 0,
      dishwashingTotal: 0,
      furnishingSurcharge: 0,
      suppliesDiscount: 0,
      frequencyDiscount: 0,
      serviceFee: 50000,
      total: 1250000,
      serviceName: 'Standard Cleaning',
      estimatedDurationMinutes: 200,
      recommendedCleaners: 2,
    });

    await renderComponent();

    await waitFor(() => {
      expect(cleaningCustomerApi.calculateQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          numberOfBedrooms: 3,
          numberOfLivingRooms: 2,
          squareMeters: null,
        })
      );
    });
    const quotePayload = (cleaningCustomerApi.calculateQuote as any).mock.calls[0][0];
    expect(quotePayload).not.toHaveProperty('numberOfFloors');
    expect(quotePayload).not.toHaveProperty('furnishingState');
    expect(quotePayload).not.toHaveProperty('frequency');

    await waitFor(() => {
      expect(
        screen.getByText(/Room charges \(3 bedrooms \+ 2 living rooms = 5 rooms × ₦1,000\.00 per room\)/i)
      ).toBeInTheDocument();
    });
  });

  it('shows the starting price and service fee without legacy floor or minimum-price rows', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 0,
      bathroomCharges: 0,
      floorCharges: 30000,
      sqMeterCharges: 0,
      minimumPrice: 600000,
      minimumAdjustment: 100000,
      addonsTotal: 0,
      dishwashingTotal: 0,
      frequencyDiscount: 0,
      serviceFee: 50000,
      total: 650000,
      serviceName: 'Standard Cleaning',
    });

    await renderComponent();

    expect(await screen.findByText(/Base cleaning price \(Standard Cleaning\)/i)).toBeInTheDocument();
    expect(screen.getByText(/quote shows the starting price/i)).toBeInTheDocument();
    expect(screen.queryByText(/floor charge|minimum-price adjustment|minimum cleaning price/i)).not.toBeInTheDocument();
    const serviceFeeRow = screen.getByText('Service fee (fixed)').parentElement!;
    expect(within(serviceFeeRow).getByText('₦500.00')).toBeInTheDocument();
    expect(screen.getByText('₦6,500.00')).toBeInTheDocument();
  });

  it('renders dishwashing catalogue items and passes dishwashingItems in quote & booking payload', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 500000,
      bathroomCharges: 200000,
      sqMeterCharges: 0,
      addonsTotal: 0,
      dishwashingTotal: 100000, // 2 x ₦500 = ₦1,000 = 100000 kobo
      dishwashingItems: [
        { itemId: 101, itemName: 'Glass Cups', unit: 'PIECE', quantity: 2, unitPriceKobo: 50000, total: 100000 },
      ],
      furnishingSurcharge: 0,
      suppliesDiscount: 0,
      frequencyDiscount: 0,
      serviceFee: 50000,
      total: 1350000,
      serviceName: 'Standard Cleaning',
      estimatedDurationMinutes: 210,
      recommendedCleaners: 2,
    });

    (cleaningCustomerApi.createBooking as any).mockResolvedValue({
      id: 99,
      transactionId: 202,
      total: 1350000,
      status: 'PAYMENT_PENDING',
      reference: 'CLN-TEST-99',
      createdAt: '2026-11-11T06:42:00.000Z',
    });

    await renderComponent();

    const catalogueToggle = screen.getByRole('button', { name: /Dishwashing Catalogue/i });
    expect(catalogueToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(catalogueToggle);

    await waitFor(() => {
      expect(screen.getAllByText(/Glass Cups/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/6-Piece Dinner Set/i)[0]).toBeInTheDocument();
    });

    const plusButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg.lucide-plus'));
    expect(plusButtons.length).toBeGreaterThan(0);

    const countInput = screen.getByRole('spinbutton', { name: 'Glass Cups count' });
    fireEvent.change(countInput, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Increase Glass Cups count' }));
    expect(countInput).toHaveValue(13);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Glass Cups count' }));
    expect(countInput).toHaveValue(12);

    fireEvent.click(catalogueToggle);
    expect(catalogueToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Dishwashing items' })).not.toBeInTheDocument();
    fireEvent.click(catalogueToggle);
    expect(catalogueToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('spinbutton', { name: 'Glass Cups count' })).toHaveValue(12);

    await waitFor(() => {
      expect(cleaningCustomerApi.calculateQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          dishwashingItems: expect.arrayContaining([{ itemId: 101, quantity: 12 }]),
        })
      );
    });
    const dishwashingCard = await screen.findByRole('group', { name: 'Dishwashing charges' });
    expect(dishwashingCard).toHaveClass('bg-slate-50');
    expect(dishwashingCard).toHaveTextContent('Listed separately from cleaning and included in your quote total.');
    expect(dishwashingCard).toHaveTextContent('Glass Cups');
    expect(dishwashingCard).toHaveTextContent('2 piece');
    expect(dishwashingCard).toHaveTextContent('+₦1,000.00');

    const bookButton = screen.getByRole('button', { name: /book & proceed to checkout/i });
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(cleaningCustomerApi.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          dishwashingItems: expect.arrayContaining([{ itemId: 101, quantity: 12 }]),
        })
      );
    });
    const bookingPayload = (cleaningCustomerApi.createBooking as any).mock.calls[0][0];
    expect(bookingPayload).not.toHaveProperty('furnishingState');
    expect(bookingPayload).not.toHaveProperty('frequency');
    expect(await screen.findByText('Phew, your booking went through, Test!')).toBeInTheDocument();
    expect(screen.getByText('CLN-TEST-99')).toBeInTheDocument();
    expect(screen.getByText(/Submitted on 11\/11\/2026, 07:42/)).toBeInTheDocument();
    expect(screen.getByText(/Payment is still pending/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'support@lofix.uk' })).toHaveAttribute('href', 'mailto:support@lofix.uk');
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeInTheDocument();
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
      sqMeterCharges: 0,
      addonsTotal: 0,
      serviceFee: 50000,
      total: 1150000,
      serviceName: 'Standard Cleaning',
    });

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Selected property has a legacy room total \(4 rooms\)/i)).toBeInTheDocument();
    });
  });

  it('shows only job-preparation supplies options without unsupported discounts or condition surcharges', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 0,
      bathroomCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      serviceFee: 0,
      total: 500000,
      serviceName: 'Standard Cleaning',
    });

    await renderComponent();

    expect(await screen.findByText(/This preference is shared for job preparation and does not change the price/i))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I will provide supplies/i })).toBeInTheDocument();
    expect(screen.queryByText(/Save 10%|Service Frequency Discount|Post-Construction|\+20%|\+50%/i))
      .not.toBeInTheDocument();
  });

  it('shows configured frequency discounts and sends the selected frequency for quotes and booking', async () => {
    (cleaningCustomerApi.getServices as any).mockResolvedValue([
      {
        id: 1,
        name: 'Standard Cleaning',
        description: 'Basic clean',
        estimatedDurationMinutes: 120,
        frequencyPromotionsEnabled: true,
        weeklyDiscountPercent: 15,
        biWeeklyDiscountPercent: 10,
        monthlyDiscountPercent: 5,
      },
    ]);
    (cleaningCustomerApi.calculateQuote as any).mockResolvedValue({
      basePrice: 500000,
      roomCharges: 0,
      bathroomCharges: 0,
      sqMeterCharges: 0,
      addonsTotal: 0,
      frequencyDiscount: -75000,
      frequencyDiscountPercent: 15,
      serviceFee: 0,
      total: 425000,
      serviceName: 'Standard Cleaning',
    });
    (cleaningCustomerApi.createBooking as any).mockResolvedValue({
      id: 99,
      transactionId: 202,
      total: 425000,
      status: 'PAYMENT_PENDING',
    });

    await renderComponent();

    const weeklyOption = await screen.findByRole('button', { name: /Weekly Save 15% on cleaning/i });
    expect(screen.getByRole('button', { name: /Every 2 weeks Save 10% on cleaning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Monthly Save 5% on cleaning/i })).toBeInTheDocument();
    fireEvent.click(weeklyOption);

    await waitFor(() => {
      expect(cleaningCustomerApi.calculateQuote).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'WEEKLY' })
      );
    });
    expect(await screen.findByText(/Frequency discount \(15%\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Book & Proceed to Checkout/i }));
    await waitFor(() => {
      expect(cleaningCustomerApi.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'WEEKLY' })
      );
    });
  });

  it('does not request an instant quote or allow booking for services requiring assessment', async () => {
    (cleaningCustomerApi.getServices as any).mockResolvedValue([
      {
        id: 2,
        name: 'Post-Construction Cleaning',
        slug: 'post-construction-cleaning',
        categoryId: 1,
        estimatedDurationMinutes: 180,
        requiresAssessment: true,
        active: true,
      },
    ]);

    await renderComponent();

    expect(await screen.findByText('Assessment required')).toBeInTheDocument();
    expect(cleaningCustomerApi.calculateQuote).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /book & proceed to checkout/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /contact lofix support/i }))
      .toHaveAttribute('href', expect.stringContaining('mailto:support@lofix.ng'));
  });

  it('explains assessment-required quote responses from the backend', async () => {
    (cleaningCustomerApi.calculateQuote as any).mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'ASSESSMENT_REQUIRED',
          message: 'This cleaning request requires an assessment before a price can be confirmed',
        },
      },
    });

    await renderComponent();

    expect(await screen.findByText('Assessment required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book & proceed to checkout/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /contact lofix support/i })).toBeInTheDocument();
  });
});
