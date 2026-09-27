import { apiClient } from './axios';
import { Apartment, Room } from './apartments';

export type ShortletBookingStatus = 'PENDING' | 'OPEN' | 'CANCELLED';

export interface ShortletPayment {
  id: number;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILURE';
  gateway: string;
  type?: string;
  createdAt: string;
  refunds?: Array<{
    id: number;
    reason?: string;
    refundDate?: string;
    category?: string;
  }>;
}

export interface ShortletBooking {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  unitPrice: number; // in integer kobo
  totalCost: number; // in integer kobo
  status: ShortletBookingStatus;
  note?: string;
  customerId: number;
  ownerId: number;
  apartmentId: number;
  roomId?: number;
  transactionId: number;
  apartment?: Apartment;
  room?: Room;
  customer?: { id: number; firstName: string; lastName: string; email: string; phoneNumber?: string };
  owner?: { id: number; firstName: string; lastName: string; email: string; phoneNumber?: string };
  payments?: ShortletPayment[];
  createdAt: string;
  updatedAt?: string;
}

export interface RefundPayload {
  refundDate?: string;
  reason: string;
  category?: 'DEFAULT';
}

export const shortletBookingsApi = {
  getShortletBookings: async (): Promise<ShortletBooking[]> => {
    const res = await apiClient.get<ShortletBooking[]>('/bookings/agent/bookings');
    return res.data;
  },

  getShortletBookingById: async (id: number): Promise<ShortletBooking> => {
    const res = await apiClient.get<ShortletBooking>(`/bookings/${id}`);
    return res.data;
  },

  updateShortletBooking: async (
    id: number,
    payload: { startDate: string; endDate: string; status?: ShortletBookingStatus; apartmentId?: number; roomId?: number }
  ): Promise<ShortletBooking> => {
    const res = await apiClient.put<ShortletBooking>(`/bookings/${id}`, payload);
    return res.data;
  },

  refundShortletBooking: async (
    id: number,
    payload: RefundPayload
  ): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/bookings/refund/${id}`, payload);
    return res.data;
  },
};
