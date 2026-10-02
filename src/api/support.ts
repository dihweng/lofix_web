import { apiClient } from './axios';

export interface SupportTicketPayload {
  orderId: number | string;
  message: string;
}

export interface SupportTicketResult {
  id: number | string;
  orderId: number | string;
  status: string;
  message?: string;
  createdAt?: string;
}

export interface SupportTicketResponse {
  message: string;
  ticket: SupportTicketResult;
}

export const supportApi = {
  createSupportTicket: async (payload: SupportTicketPayload): Promise<SupportTicketResponse> => {
    const res = await apiClient.post<SupportTicketResponse>('/support/tickets', payload);
    return res.data;
  },
};
