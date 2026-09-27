import { apiClient } from './axios';
import {
  CleaningBooking,
  PriceSnapshot,
  TrackingEvent,
  BookingReview,
  FurnishingState,
  SuppliesPreference,
  CleaningFrequency,
} from './bookings';
import { CleaningService, PropertyType, Addon } from './configuration';

export interface SavedProperty {
  id: number;
  name: string;
  propertyTypeId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  numberOfBedrooms?: number | null;
  numberOfLivingRooms?: number | null;
  numberOfRooms?: number;
  numberOfBathrooms: number;
  numberOfFloors: number;
  squareMeters?: number | null;
  accessInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteRequestPayload {
  serviceId: number;
  propertyTypeId: number;
  numberOfBedrooms?: number;
  numberOfLivingRooms?: number;
  numberOfRooms?: number;
  numberOfBathrooms: number;
  numberOfFloors: number;
  squareMeters?: number | null;
  furnishingState?: FurnishingState;
  suppliesPreference?: SuppliesPreference;
  frequency?: CleaningFrequency;
  addons?: Array<{ addonId: number; quantity: number }>;
}

export interface CreateCleaningBookingPayload {
  propertyId: number;
  serviceId: number;
  scheduledAt: string; // ISO string
  furnishingState?: FurnishingState;
  suppliesPreference?: SuppliesPreference;
  frequency?: CleaningFrequency;
  customerNote?: string;
  addons?: Array<{ addonId: number; quantity: number }>;
}

export interface ReviewSubmissionPayload {
  rating: number; // 1-5
  comment?: string;
  cleanlinessRating?: number;
  punctualityRating?: number;
  professionalismRating?: number;
}

export interface PaymentInitializationResponse {
  message: string;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  status?: string;
  publicKey?: string;
}

export const cleaningCustomerApi = {
  getServices: async (): Promise<CleaningService[]> => {
    try {
      const res = await apiClient.get<CleaningService[]>('/cleaning/services');
      return res.data;
    } catch {
      const res = await apiClient.get<CleaningService[]>('/cleaning/admin/services');
      return res.data;
    }
  },

  getPropertyTypes: async (): Promise<PropertyType[]> => {
    try {
      const res = await apiClient.get<PropertyType[]>('/cleaning/property-types');
      return res.data;
    } catch {
      const res = await apiClient.get<PropertyType[]>('/cleaning/admin/property-types');
      return res.data;
    }
  },

  getAddons: async (): Promise<Addon[]> => {
    try {
      const res = await apiClient.get<Addon[]>('/cleaning/addons');
      return res.data;
    } catch {
      const res = await apiClient.get<Addon[]>('/cleaning/admin/addons');
      return res.data;
    }
  },

  calculateQuote: async (payload: QuoteRequestPayload): Promise<PriceSnapshot> => {
    const res = await apiClient.post<PriceSnapshot>('/cleaning/quotes', payload);
    return res.data;
  },

  getSavedProperties: async (): Promise<SavedProperty[]> => {
    const res = await apiClient.get<SavedProperty[]>('/cleaning/properties');
    return res.data;
  },

  createSavedProperty: async (payload: Omit<SavedProperty, 'id'>): Promise<SavedProperty> => {
    const res = await apiClient.post<SavedProperty>('/cleaning/properties', payload);
    return res.data;
  },

  updateSavedProperty: async (id: number, payload: Partial<SavedProperty>): Promise<SavedProperty> => {
    const res = await apiClient.put<SavedProperty>(`/cleaning/properties/${id}`, payload);
    return res.data;
  },

  deleteSavedProperty: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/cleaning/properties/${id}`);
    return res.data;
  },

  createBooking: async (payload: CreateCleaningBookingPayload): Promise<CleaningBooking> => {
    const res = await apiClient.post<CleaningBooking>('/cleaning/bookings', payload);
    return res.data;
  },

  initiatePayment: async (bookingId: number): Promise<PaymentInitializationResponse> => {
    const res = await apiClient.post<PaymentInitializationResponse>(`/cleaning/bookings/${bookingId}/payment`);
    return res.data;
  },

  getCustomerBookings: async (): Promise<CleaningBooking[]> => {
    try {
      const res = await apiClient.get<CleaningBooking[]>('/cleaning/bookings');
      return res.data;
    } catch {
      const res = await apiClient.get<CleaningBooking[]>('/cleaning/admin/bookings');
      return res.data;
    }
  },

  getBookingDetail: async (bookingId: number): Promise<CleaningBooking> => {
    const res = await apiClient.get<CleaningBooking>(`/cleaning/bookings/${bookingId}`);
    return res.data;
  },

  getJobTracking: async (bookingId: number): Promise<TrackingEvent[]> => {
    const res = await apiClient.get<TrackingEvent[]>(`/cleaning/bookings/${bookingId}/tracking`);
    return res.data;
  },

  rescheduleBooking: async (bookingId: number, scheduledAt: string): Promise<CleaningBooking> => {
    const res = await apiClient.patch<CleaningBooking>(`/cleaning/bookings/${bookingId}/reschedule`, {
      scheduledAt,
    });
    return res.data;
  },

  cancelBooking: async (bookingId: number, reason: string): Promise<CleaningBooking> => {
    const res = await apiClient.post<CleaningBooking>(`/cleaning/bookings/${bookingId}/cancel`, { reason });
    return res.data;
  },

  submitReview: async (bookingId: number, payload: ReviewSubmissionPayload): Promise<BookingReview> => {
    const res = await apiClient.post<BookingReview>(`/cleaning/bookings/${bookingId}/review`, payload);
    return res.data;
  },

  getBookingReview: async (bookingId: number): Promise<BookingReview | null> => {
    try {
      const res = await apiClient.get<BookingReview | null>(`/cleaning/bookings/${bookingId}/review`);
      return res.data;
    } catch {
      return null;
    }
  },
};
