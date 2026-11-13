import { apiClient } from './axios';

export type BookingStatus =
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'CLEANER_ASSIGNED'
  | 'CLEANER_EN_ROUTE'
  | 'CLEANER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type FurnishingState = 'OCCUPIED' | 'MOVE_IN_OUT' | 'POST_CONSTRUCTION';
export type SuppliesPreference = 'SUPPLIES_INCLUDED' | 'CUSTOMER_PROVIDED';
export type CleaningFrequency = 'ONE_TIME' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
export type ContactPreference = 'CALL' | 'SMS';

export interface PropertySnapshot {
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
}

export interface PriceSnapshotAddon {
  addonId: number;
  name?: string;
  addonName?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface PriceSnapshotDishwashingItem {
  itemId: number;
  itemName?: string;
  name?: string;
  unit?: 'PIECE' | 'PAIR' | 'SET' | string;
  quantity: number;
  unitPriceKobo?: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface PriceSnapshot {
  paymentPolicy?: 'PREPAID_ONLY' | 'PAY_NOW_OR_AFTER_COMPLETION';
  basePrice: number;
  pricePerRoom?: number;
  pricePerBathroom?: number;
  roomCharges: number;
  bathroomCharges: number;
  /** Legacy-only: existing booking snapshots may contain an old floor charge. */
  floorCharges?: number;
  sqMeterCharges: number;
  /** Legacy-only: existing booking snapshots may contain an old minimum price. */
  minimumPrice?: number;
  /** Legacy-only: existing booking snapshots may contain a minimum-price adjustment. */
  minimumAdjustment?: number;
  furnishingSurcharge?: number;
  suppliesDiscount?: number; // negative integer kobo
  frequencyDiscount?: number; // negative integer kobo
  frequencyDiscountPercent?: number;
  serviceFee: number;
  addonsTotal: number;
  dishwashingTotal?: number;
  dishwashingItems?: PriceSnapshotDishwashingItem[];
  total: number;
  serviceName: string;
  estimatedDurationMinutes?: number;
  recommendedCleaners?: number;
  addons?: PriceSnapshotAddon[];
}

export interface CleaningAssignment {
  id: number;
  agentId: number;
  status: 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'EN_ROUTE' | 'ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CleaningBooking {
  paymentPolicy?: 'PREPAID_ONLY' | 'PAY_NOW_OR_AFTER_COMPLETION';
  paymentTiming?: 'PAY_NOW' | 'AFTER_COMPLETION';
  paymentStatus?: string;
  paymentDue?: boolean;
  canPayNow?: boolean;
  id: number;
  reference: string;
  accountId: number;
  propertyId: number;
  serviceId: number;
  transactionId: number;
  scheduledAt: string;
  estimatedDurationMinutes?: number;
  furnishingState?: FurnishingState;
  suppliesPreference?: SuppliesPreference;
  frequency?: CleaningFrequency;
  status: BookingStatus;
  total: number; // in integer kobo
  currency: string;
  refundRequired?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  propertySnapshot: PropertySnapshot;
  priceSnapshot: PriceSnapshot;
  customerNote?: string;
  arrivalInstructions?: string;
  accessLandmark?: string;
  contactPreference?: ContactPreference;
  contactPhoneNumber?: string;
  hasReview?: boolean;
  assignments?: CleaningAssignment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackingEvent {
  id: number;
  bookingId: number;
  actorId: number;
  status: BookingStatus;
  message?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface BookingReview {
  id: number;
  bookingId: number;
  accountId: number;
  rating: number; // 1-5
  comment?: string;
  cleanlinessRating?: number;
  punctualityRating?: number;
  professionalismRating?: number;
  createdAt: string;
}

export const bookingsApi = {
  getAdminBookings: async (
    status?: BookingStatus,
    limit = 50,
    offset = 0
  ): Promise<CleaningBooking[]> => {
    const res = await apiClient.get<CleaningBooking[]>('/cleaning/admin/bookings', {
      params: { status, limit, offset },
    });
    return res.data;
  },

  getBookingDetail: async (bookingId: number): Promise<CleaningBooking> => {
    const res = await apiClient.get<CleaningBooking>(`/cleaning/bookings/${bookingId}`);
    return res.data;
  },

  assignAgent: async (bookingId: number, agentProfileId: number): Promise<CleaningAssignment> => {
    const res = await apiClient.post<CleaningAssignment>(
      `/cleaning/admin/bookings/${bookingId}/assign-agent`,
      { agentId: agentProfileId }
    );
    return res.data;
  },

  rescheduleBooking: async (bookingId: number, scheduledAt: string): Promise<CleaningBooking> => {
    const res = await apiClient.patch<CleaningBooking>(
      `/cleaning/bookings/${bookingId}/reschedule`,
      { scheduledAt }
    );
    return res.data;
  },

  cancelBooking: async (bookingId: number, reason: string): Promise<CleaningBooking> => {
    const res = await apiClient.post<CleaningBooking>(
      `/cleaning/bookings/${bookingId}/cancel`,
      { reason }
    );
    return res.data;
  },

  getTrackingHistory: async (
    bookingId: number,
    limit = 50,
    offset = 0
  ): Promise<TrackingEvent[]> => {
    const res = await apiClient.get<TrackingEvent[]>(
      `/cleaning/bookings/${bookingId}/tracking`,
      { params: { limit, offset } }
    );
    return res.data;
  },

  getBookingReview: async (bookingId: number): Promise<BookingReview | null> => {
    const res = await apiClient.get<BookingReview | null>(
      `/cleaning/bookings/${bookingId}/review`
    );
    return res.data;
  },
};
