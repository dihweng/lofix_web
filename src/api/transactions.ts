import { apiClient } from './axios';

export type TransactionType = 'ACCOMMODATION' | 'HOME_SERVICE' | 'BILL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface SystemTransaction {
  id: number;
  reference: string;
  amount: number; // in integer kobo
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  accountId: number;
  account?: { id: number; firstName: string; lastName: string; email: string };
  booking?: { id: number; startDate: string; endDate: string; status: string; apartment?: { title: string } };
  cleaning_booking?: { id: number; reference: string; scheduledAt: string; status: string; refundRequired?: boolean };
  bill_purchase?: { id: number; type: string; target: string; status?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionReceipt {
  branding: {
    name: string;
    logoUrl?: string;
    supportEmail: string;
  };
  user: {
    name: string;
    email: string;
  };
  transaction: {
    reference: string;
    date: string;
    amount: number;
    type: string;
    status: string;
    description?: string;
  };
  details: Record<string, unknown>;
}

export interface PaymentMethodOption {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface PaymentInitializationResponse {
  paymentId?: number;
  reference: string;
  authorizationUrl?: string;
  accessCode: string; // Backend returns camelCase accessCode
  status?: string;
}

export interface PaymentRecord {
  id?: number;
  amount?: number;
  status?: string; // "paid"
  reference?: string;
  gateway?: string;
  type?: string;
}

export interface PaymentVerificationResponse {
  verified?: boolean;
  message?: string;
  status?: string; // e.g. "paid", "PAID", "COMPLETED"
  payment?: PaymentRecord;
  data?: PaymentRecord; // Backend verification endpoint returns payment record in data or root
  transaction?: SystemTransaction;
  bookingStatus?: string;
  billStatus?: string;
}

export const transactionsApi = {
  getAdminTransactions: async (): Promise<SystemTransaction[]> => {
    const res = await apiClient.get<SystemTransaction[]>('/transactions/admin/all');
    return res.data;
  },

  getTransactionById: async (id: number): Promise<SystemTransaction> => {
    const res = await apiClient.get<SystemTransaction>(`/transactions/${id}`);
    return res.data;
  },

  getTransactionReceipt: async (id: number): Promise<TransactionReceipt> => {
    const res = await apiClient.get<TransactionReceipt>(`/transactions/${id}/receipt`);
    return res.data;
  },

  getPaymentMethods: async (transactionId: number): Promise<PaymentMethodOption[]> => {
    try {
      const res = await apiClient.get<PaymentMethodOption[]>(`/transactions/${transactionId}/payment-methods`);
      console.log(`[transactionsApi] Payment methods for #${transactionId}:`, res.data);
      return res.data;
    } catch (err: any) {
      console.warn(`[transactionsApi] Failed to fetch payment methods for #${transactionId}, using fallback options:`, err);
      return [
        { code: 'CARD', name: 'Debit / Credit Card', description: 'Pay securely with Visa, Mastercard, or Verve' },
        { code: 'BANK_TRANSFER', name: 'Bank Transfer', description: 'Pay via direct bank transfer' },
        { code: 'USSD', name: 'USSD Code', description: 'Pay using your bank USSD code' },
      ];
    }
  },

  initializePayment: async (
    transactionId: number,
    method: string
  ): Promise<PaymentInitializationResponse> => {
    console.log(`[transactionsApi] POST /transactions/${transactionId}/payments/initialize`, { method });
    try {
      const res = await apiClient.post<PaymentInitializationResponse>(
        `/transactions/${transactionId}/payments/initialize`,
        { method }
      );
      console.log(`[transactionsApi] Initialize SUCCESS for #${transactionId}:`, res.data);
      return res.data;
    } catch (err: any) {
      console.error(`[transactionsApi] Initialize ERROR for #${transactionId}:`, err.response?.data || err.message);
      throw err;
    }
  },

  verifyPayment: async (
    transactionId: number,
    reference: string
  ): Promise<PaymentVerificationResponse> => {
    console.log(`[transactionsApi] POST /transactions/${transactionId}/payments/verify`, { reference });
    try {
      const res = await apiClient.post<PaymentVerificationResponse>(
        `/transactions/${transactionId}/payments/verify`,
        { reference }
      );
      console.log(`[transactionsApi] Verify RESPONSE for #${transactionId}:`, res.data);
      return res.data;
    } catch (err: any) {
      console.error(`[transactionsApi] Verify ERROR for #${transactionId}:`, err.response?.data || err.message);
      throw err;
    }
  },
};
