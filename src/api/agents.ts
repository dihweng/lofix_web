import { apiClient } from './axios';

export interface CleaningAgent {
  id: number; // Cleaning Agent Profile ID
  accountId: number; // Account ID
  verified: boolean;
  status: 'AVAILABLE' | 'OFFLINE' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifyAgentPayload {
  verified: boolean;
  status: 'AVAILABLE' | 'OFFLINE' | 'SUSPENDED';
}

export const agentsApi = {
  getAgents: async (limit = 50, offset = 0): Promise<CleaningAgent[]> => {
    const res = await apiClient.get<CleaningAgent[]>('/cleaning/admin/agents', {
      params: { limit, offset },
    });
    return res.data;
  },

  createAgentProfile: async (accountId: number): Promise<CleaningAgent> => {
    const res = await apiClient.post<CleaningAgent>('/cleaning/admin/agents', { accountId });
    return res.data;
  },

  verifyAgent: async (agentProfileId: number, payload: VerifyAgentPayload): Promise<CleaningAgent> => {
    const res = await apiClient.patch<CleaningAgent>(
      `/cleaning/admin/agents/${agentProfileId}/verification`,
      payload
    );
    return res.data;
  },
};
