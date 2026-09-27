import PaystackPop from '@paystack/inline-js';

export interface ResumePaystackOptions {
  accessCode: string;
  reference: string;
  authorizationUrl?: string;
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

/**
 * Resumes a server-initialized Paystack transaction using the server-generated accessCode.
 * No client-side public keys are used or required.
 */
export async function resumePaystackCheckout(options: ResumePaystackOptions): Promise<void> {
  const {
    accessCode,
    reference,
    authorizationUrl,
    onSuccess,
    onCancel,
    onError,
  } = options;

  if (!accessCode) {
    if (authorizationUrl && authorizationUrl.startsWith('http')) {
      window.open(authorizationUrl, '_blank');
      onSuccess(reference);
      return;
    }
    if (onError) onError('Missing server accessCode for Paystack transaction.');
    return;
  }

  try {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: (transaction: { reference?: string }) => {
        onSuccess(transaction?.reference || reference);
      },
      onCancel: () => {
        if (onCancel) onCancel();
      },
      onError: (err: any) => {
        if (onError) onError(err?.message || 'Paystack checkout error occurred.');
      },
    });
  } catch (e: any) {
    console.warn('Paystack inline-js resumeTransaction error:', e);

    // Fallback: If authorizationUrl exists, open in browser
    if (authorizationUrl && authorizationUrl.startsWith('http')) {
      window.open(authorizationUrl, '_blank');
      onSuccess(reference);
      return;
    }

    if (onError) onError(e?.message || 'Failed to launch Paystack popup.');
  }
}
