import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatNaira } from '../../utils/money';
import { propertyListingsApi } from '../../api/propertyListings';
import { EnquiryModal } from '../../components/listings/EnquiryModal';
import { PriceChangeAcceptanceModal } from '../../components/listings/PriceChangeAcceptanceModal';

vi.mock('../../api/propertyListings', () => ({
  propertyListingsApi: {
    submitEnquiry: vi.fn(),
    getShortletQuote: vi.fn(),
    createShortletBooking: vi.fn(),
  },
}));

describe('Property Listings & Pricing Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatNaira helper', () => {
    it('formats integer kobo number correctly to Naira', () => {
      expect(formatNaira(1500000)).toContain('15,000.00');
      expect(formatNaira(4500000000)).toContain('45,000,000.00');
    });

    it('formats integer kobo string correctly without magnitude distortion', () => {
      expect(formatNaira('1500000')).toContain('15,000.00');
      expect(formatNaira('250000000')).toContain('2,500,000.00');
    });

    it('handles zero or invalid input gracefully', () => {
      expect(formatNaira(0)).toContain('0.00');
      expect(formatNaira('')).toContain('0.00');
    });
  });

  describe('EnquiryModal (Rent / Sale Flow)', () => {
    const mockListing = {
      id: 99,
      title: 'Luxury 3-Bed Apartment for Rent',
      description: 'Prime Lekki location',
      purpose: 'RENT' as const,
      propertyType: 'Flat',
      address: 'Lekki Phase 1',
      price: '250000000', // kobo string -> ₦2,500,000.00
      pricePeriod: 'YEAR',
    };

    it('renders rent listing offer details and Send Enquiry CTA without payment checkout', () => {
      render(
        <EnquiryModal
          isOpen={true}
          listing={mockListing}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      expect(screen.getByText(/Property Enquiry: Luxury 3-Bed Apartment for Rent/i)).toBeInTheDocument();
      expect(screen.getByText(/₦2,500,000.00/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send enquiry/i })).toBeInTheDocument();
      expect(screen.queryByText(/proceed to pay/i)).not.toBeInTheDocument();
    });

    it('submits enquiry message to POST /property-listings/:id/enquiries', async () => {
      (propertyListingsApi.submitEnquiry as any).mockResolvedValue({
        id: 1,
        listingId: 99,
        message: 'I want to inspect this property',
        status: 'NEW',
      });

      render(
        <EnquiryModal
          isOpen={true}
          listing={mockListing}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      );

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'I want to inspect this property' },
      });

      fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

      await waitFor(() => {
        expect(propertyListingsApi.submitEnquiry).toHaveBeenCalledWith(
          99,
          'I want to inspect this property'
        );
      });
    });
  });

  describe('PriceChangeAcceptanceModal', () => {
    it('displays quoted estimate vs updated server total and requires explicit acceptance', () => {
      const mockAccept = vi.fn();
      const mockDecline = vi.fn();

      render(
        <PriceChangeAcceptanceModal
          isOpen={true}
          quotedTotal={1500000} // ₦15,000
          serverTotal={1800000} // ₦18,000
          onAccept={mockAccept}
          onDecline={mockDecline}
        />
      );

      expect(screen.getByText(/Updated Price Notice/i)).toBeInTheDocument();
      expect(screen.getByText(/₦15,000.00/i)).toBeInTheDocument();
      expect(screen.getByText(/₦18,000.00/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /accept updated price & pay/i }));
      expect(mockAccept).toHaveBeenCalled();
    });
  });
});
