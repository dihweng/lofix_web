import { apiClient } from './axios';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CleaningService {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  estimatedDurationMinutes: number;
  active: boolean;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface Addon {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  price: number; // in integer kobo
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingRule {
  id: number;
  serviceId: number;
  propertyTypeId: number;
  basePrice: number; // in kobo
  pricePerRoom: number; // in kobo
  pricePerBathroom: number; // in kobo
  pricePerFloor: number; // in kobo
  pricePerSqMeter: number; // in kobo
  minimumPrice: number; // in kobo
  serviceFee: number; // in kobo
  currency: 'NGN';
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const configurationApi = {
  // Categories
  getCategories: async (limit = 50, offset = 0): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/cleaning/admin/categories', {
      params: { limit, offset },
    });
    return res.data;
  },
  createCategory: async (data: Omit<Category, 'id'>): Promise<Category> => {
    const res = await apiClient.post<Category>('/cleaning/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id: number, data: Omit<Category, 'id'>): Promise<Category> => {
    const res = await apiClient.put<Category>(`/cleaning/admin/categories/${id}`, data);
    return res.data;
  },

  // Property Types
  getPropertyTypes: async (limit = 50, offset = 0): Promise<PropertyType[]> => {
    const res = await apiClient.get<PropertyType[]>('/cleaning/admin/property-types', {
      params: { limit, offset },
    });
    return res.data;
  },
  createPropertyType: async (data: Omit<PropertyType, 'id'>): Promise<PropertyType> => {
    const res = await apiClient.post<PropertyType>('/cleaning/admin/property-types', data);
    return res.data;
  },
  updatePropertyType: async (id: number, data: Omit<PropertyType, 'id'>): Promise<PropertyType> => {
    const res = await apiClient.put<PropertyType>(`/cleaning/admin/property-types/${id}`, data);
    return res.data;
  },

  // Services
  getServices: async (limit = 50, offset = 0, categoryId?: number): Promise<CleaningService[]> => {
    const res = await apiClient.get<CleaningService[]>('/cleaning/admin/services', {
      params: { limit, offset, categoryId },
    });
    return res.data;
  },
  createService: async (data: Omit<CleaningService, 'id'>): Promise<CleaningService> => {
    const res = await apiClient.post<CleaningService>('/cleaning/admin/services', data);
    return res.data;
  },
  updateService: async (id: number, data: Omit<CleaningService, 'id'>): Promise<CleaningService> => {
    const res = await apiClient.put<CleaningService>(`/cleaning/admin/services/${id}`, data);
    return res.data;
  },

  // Addons
  getAddons: async (limit = 50, offset = 0): Promise<Addon[]> => {
    const res = await apiClient.get<Addon[]>('/cleaning/admin/addons', {
      params: { limit, offset },
    });
    return res.data;
  },
  createAddon: async (data: Omit<Addon, 'id'>): Promise<Addon> => {
    const res = await apiClient.post<Addon>('/cleaning/admin/addons', data);
    return res.data;
  },
  updateAddon: async (id: number, data: Omit<Addon, 'id'>): Promise<Addon> => {
    const res = await apiClient.put<Addon>(`/cleaning/admin/addons/${id}`, data);
    return res.data;
  },

  // Pricing Rules
  getPricingRules: async (limit = 50, offset = 0): Promise<PricingRule[]> => {
    const res = await apiClient.get<PricingRule[]>('/cleaning/admin/pricing-rules', {
      params: { limit, offset },
    });
    return res.data;
  },
  createPricingRule: async (data: Omit<PricingRule, 'id'>): Promise<PricingRule> => {
    const res = await apiClient.post<PricingRule>('/cleaning/admin/pricing-rules', data);
    return res.data;
  },
  updatePricingRule: async (id: number, data: Omit<PricingRule, 'id'>): Promise<PricingRule> => {
    const res = await apiClient.put<PricingRule>(`/cleaning/admin/pricing-rules/${id}`, data);
    return res.data;
  },
};
