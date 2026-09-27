import { apiClient } from './axios';

export type ListingPurpose = 'RENT' | 'SALE' | 'SHORTLET';

export interface PropertyListing {
  id: number;
  title: string;
  description: string;
  purpose: ListingPurpose;
  propertyType: string;
  address: string;
  city?: string;
  state?: string;
  price: string | number; // integer kobo string or number
  pricePeriod?: string; // 'NIGHT', 'MONTH', 'YEAR', 'TOTAL'
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  images?: string[];
  featured?: boolean;
  active?: boolean;
  amenities?: string[];
  owner?: { id: number; firstName: string; lastName: string; email: string; phoneNumber?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface UserEnquiry {
  id: number;
  listingId: number;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED' | string;
  listing?: PropertyListing;
  offerSnapshot?: PropertyListing;
  createdAt: string;
  updatedAt?: string;
}

export interface ShortletListingConfig {
  listingId: number;
  minNights?: number;
  maxNights?: number;
  maxGuests?: number;
  requiresQuote?: boolean;
  onlinePaymentEnabled?: boolean;
  cleaningFee?: number; // kobo
  cautionFee?: number; // kobo
}

export interface ShortletQuotePayload {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  guests: number;
}

export interface ShortletQuoteResponse {
  nightlyPrice: number; // kobo
  nights: number;
  cleaningFee: number; // kobo
  cautionFee?: number; // kobo
  serviceFee?: number; // kobo
  total: number; // kobo
  startDate: string;
  endDate: string;
  guests: number;
}

export interface ShortletListingBookingPayload {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  guests: number;
}

export interface ShortletListingBookingResult {
  bookingId: number;
  transactionId: number; // CRITICAL: Extract and pass transactionId to PaymentModal
  reference: string;
  expires?: string;
  total: number; // kobo
  offerSnapshot?: PropertyListing;
}

export const propertyListingsApi = {
  getListings: async (
    purpose?: ListingPurpose,
    limit = 50,
    offset = 0,
    location?: string
  ): Promise<PropertyListing[]> => {
    const res = await apiClient.get<PropertyListing[]>('/property-listings', {
      params: {
        purpose: purpose ? purpose.toLowerCase() : undefined,
        limit,
        offset,
        location,
      },
    });
    return res.data;
  },

  getListingById: async (id: number): Promise<PropertyListing> => {
    const res = await apiClient.get<PropertyListing>(`/property-listings/${id}`);
    return res.data;
  },

  submitEnquiry: async (id: number, message: string): Promise<UserEnquiry> => {
    const res = await apiClient.post<UserEnquiry>(`/property-listings/${id}/enquiries`, {
      message,
    });
    return res.data;
  },

  getUserEnquiries: async (): Promise<UserEnquiry[]> => {
    const res = await apiClient.get<UserEnquiry[]>('/property-listings/my-enquiries');
    return res.data;
  },

  getShortletConfig: async (listingId: number): Promise<ShortletListingConfig> => {
    const res = await apiClient.get<ShortletListingConfig>(
      `/shortlets/listings/${listingId}/config`
    );
    return res.data;
  },

  getShortletQuote: async (
    listingId: number,
    payload: ShortletQuotePayload
  ): Promise<ShortletQuoteResponse> => {
    const res = await apiClient.post<ShortletQuoteResponse>(
      `/shortlets/listings/${listingId}/quote`,
      payload
    );
    return res.data;
  },

  createShortletBooking: async (
    listingId: number,
    payload: ShortletListingBookingPayload
  ): Promise<ShortletListingBookingResult> => {
    const res = await apiClient.post<ShortletListingBookingResult>(
      `/shortlets/listings/${listingId}/bookings`,
      payload
    );
    return res.data;
  },

  getShortletOffer: async (bookingId: number): Promise<PropertyListing> => {
    const res = await apiClient.get<PropertyListing>(`/shortlets/bookings/${bookingId}/offer`);
    return res.data;
  },
};
