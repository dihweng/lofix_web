import { apiClient } from './axios';

export type CleaningEnquiryKind = 'home' | 'commercial' | 'cleaner';
export interface IntakeContact {
  fullName: string;
  phone: string;
  email: string;
  area: string;
  notes: string;
  consent: boolean;
}
export interface CleaningRequest extends IntakeContact {
  kind: 'home' | 'commercial';
  service: string;
  propertySize: string;
  schedule: string;
  organisation?: string;
  deadline?: string;
  documentUrl?: string;
}
export interface CleanerApplication extends IntakeContact {
  experience: 'NEW' | 'UNDER_ONE_YEAR' | 'ONE_TO_THREE_YEARS' | 'OVER_THREE_YEARS';
  availability: 'PART_TIME' | 'FULL_TIME' | 'WEEKENDS';
}
export interface IntakeResult { message: string; ticket: { id: number } }
export const cleaningIntakeApi = {
  request: async (payload: CleaningRequest): Promise<IntakeResult> =>
    (await apiClient.post('/support/cleaning-requests', payload)).data,
  apply: async (payload: CleanerApplication): Promise<IntakeResult> =>
    (await apiClient.post('/support/cleaner-applications', payload)).data,
};
