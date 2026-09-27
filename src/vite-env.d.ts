/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@paystack/inline-js' {
  export default class PaystackPop {
    constructor();
    resumeTransaction(
      accessCode: string,
      options?: {
        onSuccess?: (transaction: { reference?: string; status?: string }) => void;
        onCancel?: () => void;
        onError?: (error: any) => void;
      }
    ): void;
    newTransaction(options: any): void;
  }
}
