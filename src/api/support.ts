import { apiClient } from './axios';

export interface SupportTicketPayload {
  orderId: number | string;
  message: string;
}

export interface ContactMessage {
  id: number;
  subject: string;
  message?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  replies?: { id: number; body: string; createdAt: string }[];
}
export interface UserNotification {
  id: number;
  messageId: number;
  title: string;
  readAt: string | null;
  createdAt: string;
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
  getMessages: async (offset = 0): Promise<{ items: ContactMessage[]; total: number }> =>
    (await apiClient.get('/support/messages', { params: { limit: 20, offset } })).data,
  getMessage: async (id: number): Promise<ContactMessage> =>
    (await apiClient.get(`/support/messages/${id}`)).data,
  getNotifications: async (offset = 0): Promise<{ items: UserNotification[]; unreadCount: number; total: number }> =>
    (await apiClient.get('/support/notifications', { params: { limit: 20, offset } })).data,
  markNotificationRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/support/notifications/${id}/read`, {});
  },
  sendMessage: async (payload: { subject: string; message: string }): Promise<{ message: string }> =>
    (await apiClient.post('/support/messages', payload)).data,
  createSupportTicket: async (payload: SupportTicketPayload): Promise<SupportTicketResponse> => {
    const res = await apiClient.post<SupportTicketResponse>('/support/tickets', payload);
    return res.data;
  },
};
