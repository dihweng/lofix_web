import { apiClient } from './axios';
import { Apartment, Room } from './apartments';
import { ShortletBooking } from './shortletBookings';
import { PaymentInitializationResponse } from './cleaningCustomer';

export interface CreateShortletBookingPayload {
  apartmentId: number;
  roomId?: number;
  startDate: string; // YYYY-MM-DD or ISO
  endDate: string; // YYYY-MM-DD or ISO
  note?: string;
}

export const shortletCustomerApi = {
  getApartments: async (): Promise<Apartment[]> => {
    try {
      const res = await apiClient.get<Apartment[]>('/apartments/search/search');
      return res.data;
    } catch {
      const res = await apiClient.get<Apartment[]>('/apartments');
      return res.data;
    }
  },

  getApartmentById: async (id: number): Promise<Apartment> => {
    const res = await apiClient.get<Apartment>(`/apartments/${id}`);
    return res.data;
  },

  getRooms: async (): Promise<Room[]> => {
    const res = await apiClient.get<Room[]>('/rooms');
    return res.data;
  },

  getRoomById: async (id: number): Promise<Room> => {
    const res = await apiClient.get<Room>(`/rooms/${id}`);
    return res.data;
  },

  createBooking: async (payload: CreateShortletBookingPayload): Promise<ShortletBooking> => {
    const res = await apiClient.post<ShortletBooking>('/bookings', payload);
    return res.data;
  },

  initiatePayment: async (bookingId: number): Promise<PaymentInitializationResponse> => {
    const res = await apiClient.post<PaymentInitializationResponse>(`/bookings/${bookingId}/payment`);
    return res.data;
  },

  getCustomerBookings: async (): Promise<ShortletBooking[]> => {
    try {
      const res = await apiClient.get<ShortletBooking[]>('/bookings/customer/bookings');
      return res.data;
    } catch {
      try {
        const res = await apiClient.get<ShortletBooking[]>('/bookings');
        return res.data;
      } catch {
        const res = await apiClient.get<ShortletBooking[]>('/bookings/agent/bookings');
        return res.data;
      }
    }
  },

  getBookingById: async (id: number): Promise<ShortletBooking> => {
    const res = await apiClient.get<ShortletBooking>(`/bookings/${id}`);
    return res.data;
  },
};
