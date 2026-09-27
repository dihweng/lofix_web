import { apiClient } from './axios';
import { PropertySnapshot } from './bookings';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AgentJob {
  id: number; // Assignment ID
  agentId: number;
  bookingId?: number;
  status: AssignmentStatus;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  cleaning_booking?: {
    id: number;
    reference: string;
    scheduledAt: string;
    estimatedDurationMinutes: number;
    status: string;
    propertySnapshot: PropertySnapshot;
    customerNote?: string;
  };
}

export interface JobActionPayload {
  latitude?: number;
  longitude?: number;
  message?: string;
}

export const agentCleaningApi = {
  updateAvailability: async (status: 'AVAILABLE' | 'OFFLINE'): Promise<{ status: string }> => {
    const res = await apiClient.patch<{ status: string }>('/cleaning/agent/availability', { status });
    return res.data;
  },

  getAgentJobs: async (limit = 50, offset = 0): Promise<AgentJob[]> => {
    const res = await apiClient.get<AgentJob[]>('/cleaning/agent/jobs', {
      params: { limit, offset },
    });
    return res.data;
  },

  getAgentJobById: async (bookingId: number): Promise<AgentJob> => {
    const res = await apiClient.get<AgentJob>(`/cleaning/agent/jobs/${bookingId}`);
    return res.data;
  },

  acceptJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/accept`, payload || {});
    return res.data;
  },

  rejectJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/reject`, payload || {});
    return res.data;
  },

  enRouteJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/en-route`, payload || {});
    return res.data;
  },

  arrivedJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/arrived`, payload || {});
    return res.data;
  },

  startJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/start`, payload || {});
    return res.data;
  },

  completeJob: async (bookingId: number, payload?: JobActionPayload): Promise<AgentJob> => {
    const res = await apiClient.post<AgentJob>(`/cleaning/agent/jobs/${bookingId}/complete`, payload || {});
    return res.data;
  },
};
