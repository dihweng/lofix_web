import { apiClient } from './axios';

export interface Apartment {
  id: number;
  title: string;
  description: string;
  apartmentType: 'FLAT' | 'DUPLEX';
  totalBedrooms: number;
  totalOccupancy: number;
  price: number; // integer kobo
  address: string;
  longitude: number;
  latitude: number;
  isPartyAllowed?: boolean;
  hasTv?: boolean;
  hasKitchen?: boolean;
  hasAirCon?: boolean;
  hasHeating?: boolean;
  hasInternet?: boolean;
  hasWater?: boolean;
  hasLight?: boolean;
  isListed?: boolean;
  isActivated?: boolean;
  commission?: number;
  ownerId?: number;
  accountId?: number;
  account?: { id: number; firstName: string; lastName: string; email: string };
  owner?: { id: number; firstName: string; lastName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  bedType: 'SINGLE' | 'DOUBLE' | 'MULTIPLE';
  price: number; // integer kobo
  apartmentId: number;
  totalOccupancy: number;
  isPartyAllowed?: boolean;
  isLoudMusicAllowed?: boolean;
  hasPrivateToilet?: boolean;
  hasTv?: boolean;
  hasKitchen?: boolean;
  hasAirCon?: boolean;
  hasHeating?: boolean;
  hasInternet?: boolean;
  hasWater?: boolean;
  hasLight?: boolean;
  isListed?: boolean;
  apartment?: Apartment;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApartmentPayload {
  title: string;
  description: string;
  apartmentType: 'FLAT' | 'DUPLEX';
  totalBedrooms: number;
  totalOccupancy: number;
  price: number; // Naira amount sent from form, backend converts to minor units
  address: string;
  longitude: number;
  latitude: number;
  isPartyAllowed?: boolean;
  hasTv?: boolean;
  hasKitchen?: boolean;
  hasAirCon?: boolean;
  hasHeating?: boolean;
  hasInternet?: boolean;
  hasWater?: boolean;
  hasLight?: boolean;
  isListed?: boolean;
  isActivated?: boolean;
  commission?: number;
  ownerId?: number;
}

export interface RoomPayload {
  title: string;
  description: string;
  bedType: 'SINGLE' | 'DOUBLE' | 'MULTIPLE';
  price: number; // Naira amount sent from form, backend converts to minor units
  apartmentId: number;
  totalOccupancy: number;
  isPartyAllowed?: boolean;
  isLoudMusicAllowed?: boolean;
  hasPrivateToilet?: boolean;
  hasTv?: boolean;
  hasKitchen?: boolean;
  hasAirCon?: boolean;
  hasHeating?: boolean;
  hasInternet?: boolean;
  hasWater?: boolean;
  hasLight?: boolean;
  isListed?: boolean;
}

export const apartmentsApi = {
  // Apartments
  getApartments: async (): Promise<Apartment[]> => {
    const res = await apiClient.get<Apartment[]>('/apartments');
    return res.data;
  },

  getApartmentById: async (id: number): Promise<Apartment> => {
    const res = await apiClient.get<Apartment>(`/apartments/${id}`);
    return res.data;
  },

  createApartment: async (payload: ApartmentPayload): Promise<Apartment> => {
    const res = await apiClient.post<Apartment>('/apartments', payload);
    return res.data;
  },

  updateApartment: async (id: number, payload: ApartmentPayload): Promise<Apartment> => {
    const res = await apiClient.put<Apartment>(`/apartments/${id}`, payload);
    return res.data;
  },

  deleteApartment: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/apartments/${id}`);
    return res.data;
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    const res = await apiClient.get<Room[]>('/rooms');
    return res.data;
  },

  getRoomById: async (id: number): Promise<Room> => {
    const res = await apiClient.get<Room>(`/rooms/${id}`);
    return res.data;
  },

  createRoom: async (payload: RoomPayload): Promise<Room> => {
    const res = await apiClient.post<Room>('/rooms', payload);
    return res.data;
  },

  updateRoom: async (id: number, payload: RoomPayload): Promise<Room> => {
    const res = await apiClient.put<Room>(`/rooms/${id}`, payload);
    return res.data;
  },

  deleteRoom: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/rooms/${id}`);
    return res.data;
  },
};
