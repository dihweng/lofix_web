import { apiClient } from './axios';

export interface FaqEntry {
  id: number;
  slug: string;
  version: number;
  title: string;
  body: string;
  details: {
    category?: string;
    audience?: 'customer' | 'agent' | 'all';
    sortOrder?: number;
    featured?: boolean;
  };
}

export const faqsApi = {
  list: async () => (await apiClient.get<FaqEntry[]>('/faqs')).data,
};
