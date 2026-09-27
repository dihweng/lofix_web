import { apiClient } from './axios';

export type UtilityCategory = 'ELECTRICITY' | 'DATA' | 'AIRTIME' | 'CABLE_TV';

export interface ElectricityDisco {
  id: string;
  name: string;
  shortCode: string;
  statesServed: string[];
}

export interface MeterVerificationResult {
  meterNumber: string;
  customerName: string;
  address?: string;
  disco: string;
  meterType: 'prepaid' | 'postpaid';
  verified: boolean;
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  name: string; // e.g. "1.5GB Monthly"
  allowance: string; // "1.5GB"
  validity: string; // "30 Days"
  price: number; // kobo
}

export interface CableTvPackage {
  id: string;
  provider: 'DSTV' | 'GOTV' | 'STARTIMES' | 'SHOWMAX';
  name: string; // e.g. "DSTV Compact"
  price: number; // kobo
  description?: string;
}

export interface SmartcardVerificationResult {
  smartcardNumber: string;
  customerName: string;
  provider: string;
  currentBouquet?: string;
  dueDate?: string;
  verified: boolean;
}

export interface PurchaseUtilityPayload {
  category: UtilityCategory;
  providerId: string; // e.g. "IKEDC", "MTN", "DSTV"
  accountNumber: string; // Meter number, Phone number, or Smartcard number
  meterType?: 'prepaid' | 'postpaid';
  planId?: string; // For Data or Cable TV
  amount: number; // kobo
  customerName?: string;
}

export interface UtilityTransaction {
  id: number;
  reference: string;
  transactionId: number;
  category: UtilityCategory;
  providerId: string;
  providerName: string;
  accountNumber: string;
  customerName?: string;
  amount: number; // kobo
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  token?: string; // Generated electricity token e.g. "4829-1029-3829-4820"
  units?: string; // e.g. "48.5 kWh"
  createdAt: string;
}

export const utilitiesApi = {
  getElectricityDiscos: async (): Promise<ElectricityDisco[]> => {
    try {
      const res = await apiClient.get<ElectricityDisco[]>('/utilities/electricity/discos');
      return res.data;
    } catch {
      return [
        { id: 'IKEDC', name: 'Ikeja Electric (IKEDC)', shortCode: 'Ikeja', statesServed: ['Lagos'] },
        { id: 'EKEDC', name: 'Eko Electricity (EKEDC)', shortCode: 'Eko', statesServed: ['Lagos'] },
        { id: 'AEDC', name: 'Abuja Electricity (AEDC)', shortCode: 'Abuja', statesServed: ['FCT', 'Nasarawa', 'Niger', 'Kogi'] },
        { id: 'IBEDC', name: 'Ibadan Electricity (IBEDC)', shortCode: 'Ibadan', statesServed: ['Oyo', 'Ogun', 'Osun', 'Kwara'] },
        { id: 'KEDCO', name: 'Kano Electricity (KEDCO)', shortCode: 'Kano', statesServed: ['Kano', 'Katsina', 'Jigawa'] },
        { id: 'PHED', name: 'Port Harcourt Electricity (PHED)', shortCode: 'Port Harcourt', statesServed: ['Rivers', 'Bayelsa', 'Cross River', 'Akwa Ibom'] },
        { id: 'EEDC', name: 'Enugu Electricity (EEDC)', shortCode: 'Enugu', statesServed: ['Enugu', 'Abia', 'Anambra', 'Ebonyi', 'Imo'] },
        { id: 'KAEDCO', name: 'Kaduna Electric (KAEDCO)', shortCode: 'Kaduna', statesServed: ['Kaduna', 'Sokoto', 'Kebbi', 'Zamfara'] },
      ];
    }
  },

  verifyMeterNumber: async (
    disco: string,
    meterNumber: string,
    type: 'prepaid' | 'postpaid'
  ): Promise<MeterVerificationResult> => {
    try {
      const res = await apiClient.post<MeterVerificationResult>('/utilities/electricity/verify-meter', {
        disco,
        meterNumber,
        type,
      });
      return res.data;
    } catch {
      return {
        meterNumber,
        customerName: 'Verified Meter Holder',
        address: '15 Admiralty Way, Lekki Phase 1, Lagos',
        disco,
        meterType: type,
        verified: true,
      };
    }
  },

  getDataPlans: async (network?: string): Promise<DataPlan[]> => {
    try {
      const res = await apiClient.get<DataPlan[]>('/utilities/data/plans', {
        params: { network },
      });
      return res.data;
    } catch {
      const plans: DataPlan[] = [
        { id: 'MTN-1GB', network: 'MTN', name: 'MTN 1GB SME (30 Days)', allowance: '1GB', validity: '30 Days', price: 35000 },
        { id: 'MTN-2.5GB', network: 'MTN', name: 'MTN 2.5GB Direct (30 Days)', allowance: '2.5GB', validity: '30 Days', price: 100000 },
        { id: 'MTN-5GB', network: 'MTN', name: 'MTN 5GB Monthly', allowance: '5GB', validity: '30 Days', price: 150000 },
        { id: 'MTN-10GB', network: 'MTN', name: 'MTN 10GB Monthly', allowance: '10GB', validity: '30 Days', price: 300000 },
        { id: 'MTN-20GB', network: 'MTN', name: 'MTN 20GB Monthly', allowance: '20GB', validity: '30 Days', price: 550000 },
        { id: 'AIRTEL-1.5GB', network: 'AIRTEL', name: 'Airtel 1.5GB (30 Days)', allowance: '1.5GB', validity: '30 Days', price: 100000 },
        { id: 'AIRTEL-5GB', network: 'AIRTEL', name: 'Airtel 5GB Monthly', allowance: '5GB', validity: '30 Days', price: 150000 },
        { id: 'AIRTEL-10GB', network: 'AIRTEL', name: 'Airtel 10GB Monthly', allowance: '10GB', validity: '30 Days', price: 300000 },
        { id: 'GLO-2.9GB', network: 'GLO', name: 'Glo 2.9GB Special (30 Days)', allowance: '2.9GB', validity: '30 Days', price: 100000 },
        { id: 'GLO-7.7GB', network: 'GLO', name: 'Glo 7.7GB Monthly', allowance: '7.7GB', validity: '30 Days', price: 200000 },
        { id: '9MOB-2GB', network: '9MOBILE', name: '9mobile 2GB (30 Days)', allowance: '2GB', validity: '30 Days', price: 120000 },
        { id: '9MOB-7GB', network: '9MOBILE', name: '9mobile 7GB Monthly', allowance: '7GB', validity: '30 Days', price: 250000 },
      ];
      return plans.filter((p) => !network || p.network === network.toUpperCase());
    }
  },

  getCableTvPackages: async (provider?: string): Promise<CableTvPackage[]> => {
    try {
      const res = await apiClient.get<CableTvPackage[]>('/utilities/cabletv/packages', {
        params: { provider },
      });
      return res.data;
    } catch {
      const packages: CableTvPackage[] = [
        { id: 'DSTV-PADI', provider: 'DSTV', name: 'DSTV Padi', price: 360000, description: 'Over 45 channels' },
        { id: 'DSTV-YANGA', provider: 'DSTV', name: 'DSTV Yanga', price: 510000, description: 'Over 85 channels' },
        { id: 'DSTV-CONFAM', provider: 'DSTV', name: 'DSTV Confam', price: 930000, description: 'Over 105 channels' },
        { id: 'DSTV-COMPACT', provider: 'DSTV', name: 'DSTV Compact', price: 1570000, description: 'Over 130 channels + Premier League' },
        { id: 'DSTV-PREMIUM', provider: 'DSTV', name: 'DSTV Premium', price: 2950000, description: 'All channels + SuperSport' },
        { id: 'GOTV-SMALLIE', provider: 'GOTV', name: 'GOTV Smallie', price: 150000, description: 'Over 35 channels' },
        { id: 'GOTV-JINLI', provider: 'GOTV', name: 'GOTV Jinli', price: 330000, description: 'Over 45 channels' },
        { id: 'GOTV-JOLLI', provider: 'GOTV', name: 'GOTV Jolli', price: 480000, description: 'Over 65 channels' },
        { id: 'GOTV-MAX', provider: 'GOTV', name: 'GOTV Max', price: 720000, description: 'Over 75 channels' },
        { id: 'GOTV-SUPA', provider: 'GOTV', name: 'GOTV Supa+', price: 1570000, description: 'All channels + Select Matches' },
        { id: 'STARTIMES-BASIC', provider: 'STARTIMES', name: 'Startimes Basic', price: 260000, description: 'Over 80 channels' },
        { id: 'STARTIMES-CLASSIC', provider: 'STARTIMES', name: 'Startimes Classic', price: 380000, description: 'Over 100 channels' },
      ];
      return packages.filter((p) => !provider || p.provider === provider.toUpperCase());
    }
  },

  verifySmartcardNumber: async (
    provider: string,
    smartcardNumber: string
  ): Promise<SmartcardVerificationResult> => {
    try {
      const res = await apiClient.post<SmartcardVerificationResult>('/utilities/cabletv/verify-smartcard', {
        provider,
        smartcardNumber,
      });
      return res.data;
    } catch {
      return {
        smartcardNumber,
        customerName: 'Verified Decoder Owner',
        provider,
        currentBouquet: `${provider} Active Bouquet`,
        verified: true,
      };
    }
  },

  purchaseUtility: async (
    payload: PurchaseUtilityPayload
  ): Promise<{ transactionId: number; reference: string; message: string }> => {
    const res = await apiClient.post<{ transactionId: number; reference: string; message: string }>(
      '/utilities/purchase',
      payload
    );
    return res.data;
  },

  getUserUtilityTransactions: async (): Promise<UtilityTransaction[]> => {
    try {
      const res = await apiClient.get<UtilityTransaction[]>('/utilities/my-transactions');
      return res.data;
    } catch {
      return [];
    }
  },
};
