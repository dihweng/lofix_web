import { apiClient } from './axios';

export type UtilityCategory = 'AIRTIME' | 'DATA' | 'CABLE' | 'ELECTRICITY';

export interface VtpassService {
  serviceID: string;
  name: string;
  category?: string;
  image?: string;
  minimium_amount?: string | number;
  maximum_amount?: string | number;
}

export interface VtpassVariation {
  variation_code: string;
  name: string;
  variation_amount: string | number;
  fixedPrice?: string;
}

export interface VtpassVerifyPayload {
  serviceID: string;
  target: string;
  meterType?: 'prepaid' | 'postpaid';
}

export interface VtpassVerifyResult {
  customerName?: string;
  customer_Name?: string;
  Customer_Name?: string;
  address?: string;
  currentBouquet?: string;
  dueDate?: string;
  verified: boolean;
  message?: string;
}

export interface CreateVtpassOrderPayload {
  idempotencyKey: string;
  type: UtilityCategory;
  serviceID: string;
  target: string; // meter number, phone, smartcard
  meterType?: 'prepaid' | 'postpaid';
  phone?: string; // contact phone for DATA/CABLE/ELECTRICITY
  amount?: number; // kobo integer (required for AIRTIME & ELECTRICITY, omitted for DATA & CABLE)
  variationCode?: string; // required for DATA & CABLE
  subscriptionType?: 'change' | 'renew'; // optional for CABLE
}

export interface ElectricityReceipt {
  receiptNumber?: string;
  customerName?: string;
  customerAddress?: string;
  units?: string;
  tariff?: number | string;
  taxAmount?: number | string; // kobo
  debtAmount?: number | string; // kobo
  tokenAmount?: number | string; // kobo
  fixedChargeAmount?: number | string; // kobo
  amountUnit?: string;
  currency?: string;
}

export interface ElectricityOrderInfo {
  customerName?: string;
  customerAddress?: string;
  meterNumber?: string;
  meterType?: string;
  serviceID?: string;
  receipt?: ElectricityReceipt | null;
}

export interface VtpassOrderResult {
  orderId: string;
  transactionId: number;
  amount: number; // kobo
  fee?: number; // kobo
  totalAmount?: number; // kobo
  electricity?: ElectricityOrderInfo | null;
  status: 'READY' | 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  reference?: string;
  message?: string;
}

export interface VtpassOrderDetail {
  orderId: string;
  transactionId: number;
  type: UtilityCategory | string;
  serviceID: string;
  serviceName?: string;
  target: string;
  phone?: string;
  amount: number; // kobo
  fee?: number; // kobo
  totalAmount?: number; // kobo
  electricity?: ElectricityOrderInfo | null;
  status: 'READY' | 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  paymentStatus?: string;
  deliveryStatus?: string;
  message?: string;
  canRetry?: boolean;
  retryAfterSeconds?: number;
  requiresSupport?: boolean;
  supportReason?: 'TOKEN_MISSING' | 'DELIVERY_DELAYED' | 'DELIVERY_FAILED' | string;
  reference?: string;
  providerReference?: string;
  token?: string; // Generated electricity token e.g. "4829-1029-3829-4820"
  units?: string; // e.g. "48.5 kWh"
  responseDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ElectricityState {
  code: string;
  name: string;
  providerIds: string[];
}

export interface ElectricityProvider {
  serviceID: string;
  name: string;
  stateCodes: string[];
  stateCount: number;
  available: boolean;
  unavailableReason?: string;
  coverageNote?: string;
}

export interface ElectricityCatalogue {
  states: ElectricityState[];
  providers: ElectricityProvider[];
  processor?: string;
  environment?: string;
  coverageNote?: string;
}

export const utilitiesApi = {
  // 0. Fetch Electricity Catalogue: GET /bills/vtpass/electricity/catalogue
  getElectricityCatalogue: async (): Promise<ElectricityCatalogue> => {
    const res = await apiClient.get<ElectricityCatalogue>('/bills/vtpass/electricity/catalogue');
    return res.data;
  },

  // 1. Fetch provider services: GET /bills/vtpass/services/{type}
  getVtpassServices: async (type: UtilityCategory): Promise<VtpassService[]> => {
    try {
      const res = await apiClient.get<VtpassService[]>(`/bills/vtpass/services/${type}`);
      return res.data;
    } catch {
      if (type === 'ELECTRICITY') {
        return [
          { serviceID: 'ikeja-electric', name: 'Ikeja Electric (IKEDC)' },
          { serviceID: 'portharcourt-electric', name: 'Port Harcourt Electric (PHED)' },
          { serviceID: 'aba-electric', name: 'Aba Power (APLE)' },
        ];
      } else if (type === 'DATA') {
        return [
          { serviceID: 'mtn-data', name: 'MTN Data' },
          { serviceID: 'airtel-data', name: 'Airtel Data' },
          { serviceID: 'glo-data', name: 'Glo Data' },
          { serviceID: 'etisalat-data', name: '9mobile Data' },
        ];
      } else if (type === 'CABLE') {
        return [
          { serviceID: 'dstv', name: 'DSTV Subscription' },
          { serviceID: 'gotv', name: 'GOTV Subscription' },
          { serviceID: 'startimes', name: 'Startimes Subscription' },
          { serviceID: 'showmax', name: 'Showmax' },
        ];
      } else {
        return [
          { serviceID: 'mtn', name: 'MTN Airtime' },
          { serviceID: 'airtel', name: 'Airtel Airtime' },
          { serviceID: 'glo', name: 'Glo Airtime' },
          { serviceID: 'etisalat', name: '9mobile Airtime' },
        ];
      }
    }
  },

  // 2. Fetch data/TV plans: GET /bills/vtpass/variations/{type}/{serviceID}
  getVtpassVariations: async (
    type: 'DATA' | 'CABLE',
    serviceID: string
  ): Promise<VtpassVariation[]> => {
    try {
      const res = await apiClient.get<VtpassVariation[]>(
        `/bills/vtpass/variations/${type}/${serviceID}`
      );
      return res.data;
    } catch {
      if (type === 'DATA') {
        return [
          { variation_code: 'mtn-1gb', name: '1.0 GB (30 Days)', variation_amount: 350 },
          { variation_code: 'mtn-2.5gb', name: '2.5 GB (30 Days)', variation_amount: 1000 },
          { variation_code: 'mtn-5gb', name: '5.0 GB Monthly', variation_amount: 1500 },
          { variation_code: 'mtn-10gb', name: '10.0 GB Monthly', variation_amount: 3000 },
          { variation_code: 'mtn-20gb', name: '20.0 GB Monthly', variation_amount: 5500 },
        ];
      } else {
        return [
          { variation_code: 'dstv-padi', name: 'DSTV Padi', variation_amount: 3600 },
          { variation_code: 'dstv-yanga', name: 'DSTV Yanga', variation_amount: 5100 },
          { variation_code: 'dstv-confam', name: 'DSTV Confam', variation_amount: 9300 },
          { variation_code: 'dstv-compact', name: 'DSTV Compact', variation_amount: 15700 },
          { variation_code: 'dstv-premium', name: 'DSTV Premium', variation_amount: 29500 },
        ];
      }
    }
  },

  // 3. Target verification: POST /bills/vtpass/verify
  verifyVtpassTarget: async (payload: VtpassVerifyPayload): Promise<VtpassVerifyResult> => {
    const res = await apiClient.post<VtpassVerifyResult>('/bills/vtpass/verify', payload);
    const data = res.data;
    const name = data.customerName || data.customer_Name || data.Customer_Name || 'Verified Account Holder';
    return { ...data, customerName: name, verified: data.verified !== false };
  },

  // 4. Create unpaid order: POST /bills/vtpass/orders
  createVtpassOrder: async (payload: CreateVtpassOrderPayload): Promise<VtpassOrderResult> => {
    const res = await apiClient.post<VtpassOrderResult>('/bills/vtpass/orders', payload);
    return res.data;
  },

  // 5. Track service delivery: GET /bills/vtpass/orders/{orderId}
  getVtpassOrderStatus: async (orderId: string): Promise<VtpassOrderDetail> => {
    const res = await apiClient.get<VtpassOrderDetail>(`/bills/vtpass/orders/${orderId}`);
    return res.data;
  },

  // 5b. Retry status check: POST /bills/vtpass/orders/{orderId}/retry
  retryVtpassOrder: async (orderId: string): Promise<VtpassOrderDetail> => {
    const res = await apiClient.post<VtpassOrderDetail>(`/bills/vtpass/orders/${orderId}/retry`, {});
    return res.data;
  },

  // 6. User order history: GET /bills/vtpass/my-orders
  getUserVtpassOrders: async (): Promise<VtpassOrderDetail[]> => {
    let rawList: any[] = [];
    try {
      const res = await apiClient.get<any[]>('/bills/vtpass/my-orders');
      if (Array.isArray(res.data)) {
        rawList = res.data;
      }
    } catch {
      rawList = [];
    }

    return rawList.map((item: any) => {
      const orderId =
        item.orderId ||
        item.order_id ||
        item.reference ||
        item.ref ||
        (item.id ? `${item.id}` : 'ORD-101');

      const transactionId = item.transactionId || item.transaction_id || item.id || 0;
      const type = item.type || item.category || item.bill_purchase?.type || 'BILL';

      const serviceID =
        item.serviceID ||
        item.service_id ||
        item.providerId ||
        item.provider_id ||
        item.serviceName ||
        item.description ||
        'VTpass Utility';

      const serviceName =
        item.serviceName ||
        item.service_name ||
        item.providerName ||
        item.provider_name ||
        item.name ||
        serviceID;

      const target =
        item.target ||
        item.accountNumber ||
        item.account_number ||
        item.phone ||
        item.bill_purchase?.target ||
        'Account';

      const amount = item.amount || item.amountKobo || (item.amountNaira ? item.amountNaira * 100 : 0);

      const status =
        item.status === 'SUCCESSFUL' || item.status === 'PAID' || item.status === 'COMPLETED'
          ? 'SUCCESS'
          : item.status === 'FAILED'
          ? 'FAILED'
          : item.status || 'PENDING';

      const token = item.token || item.bill_purchase?.token || item.details?.token;
      const units = item.units || item.bill_purchase?.units || item.details?.units;

      return {
        orderId,
        transactionId,
        type,
        serviceID,
        serviceName,
        target,
        phone: item.phone,
        amount,
        status,
        paymentStatus: item.paymentStatus || item.payment_status,
        deliveryStatus: item.deliveryStatus || item.delivery_status || status,
        message: item.message,
        canRetry: item.canRetry ?? item.can_retry,
        retryAfterSeconds: item.retryAfterSeconds ?? item.retry_after_seconds,
        requiresSupport: item.requiresSupport ?? item.requires_support,
        supportReason: item.supportReason || item.support_reason,
        reference: item.reference || item.ref,
        providerReference: item.providerReference || item.provider_reference || item.providerReferenceId,
        token,
        units,
        responseDescription: item.responseDescription || item.response_description,
        createdAt: item.createdAt || item.created_at || item.date,
      };
    });
  },
};
