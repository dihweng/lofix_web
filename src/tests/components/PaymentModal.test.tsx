import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModal } from '../../components/payment/PaymentModal';
import { transactionsApi } from '../../api/transactions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as paystackUtils from '../../utils/paystack';

vi.mock('../../api/transactions', () => ({
  transactionsApi: {
    getTransactionById: vi.fn(),
    getPaymentMethods: vi.fn(),
    initializePayment: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

vi.mock('../../utils/paystack', () => ({
  resumePaystackCheckout: vi.fn(),
}));

describe('PaymentModal component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (transactionsApi.getTransactionById as any).mockResolvedValue({
      id: 42,
      reference: 'TX-42-REF',
      amount: 1500000,
      type: 'HOME_SERVICE',
      status: 'PENDING',
      description: '2 Bedroom Deep Cleaning',
      accountId: 1,
    });

    (transactionsApi.getPaymentMethods as any).mockResolvedValue([
      { code: 'CARD', name: 'Debit / Credit Card', description: 'Pay via Card' },
      { code: 'BANK_TRANSFER', name: 'Bank Transfer', description: 'Pay via Direct Transfer' },
      { code: 'USSD', name: 'USSD Code', description: 'Pay via USSD' },
    ]);

    (paystackUtils.resumePaystackCheckout as any).mockImplementation(() => Promise.resolve());
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PaymentModal
          isOpen={true}
          transactionId={42}
          onClose={() => {}}
          onSuccess={() => {}}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders payment summary and methods returned by backend', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Transaction #TX-42-REF/i)).toBeInTheDocument();
      expect(screen.getByText(/Debit \/ Credit Card/i)).toBeInTheDocument();
      expect(screen.getByText(/Bank Transfer/i)).toBeInTheDocument();
      expect(screen.getByText(/USSD Code/i)).toBeInTheDocument();
    });
  });

  it('submits selected payment method and calls resumePaystackCheckout with accessCode', async () => {
    (transactionsApi.initializePayment as any).mockResolvedValue({
      paymentId: 101,
      reference: 'PAY-REF-101',
      accessCode: 'SERVER_ACCESS_CODE_999',
      authorizationUrl: 'https://checkout.paystack.com/999',
    });

    renderComponent();

    await screen.findByText(/Debit \/ Credit Card/i);

    fireEvent.click(screen.getByText(/Bank Transfer/i));
    fireEvent.click(screen.getByRole('button', { name: /proceed to pay/i }));

    await waitFor(() => {
      expect(transactionsApi.initializePayment).toHaveBeenCalledWith(42, 'BANK_TRANSFER');
      expect(paystackUtils.resumePaystackCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          accessCode: 'SERVER_ACCESS_CODE_999',
          reference: 'PAY-REF-101',
        })
      );
    });
  });

  it('verifies transaction when payment record returns status "paid"', async () => {
    const mockOnSuccess = vi.fn();

    (transactionsApi.initializePayment as any).mockResolvedValue({
      reference: 'PAY-REF-PAID',
      accessCode: 'ACCESS_CODE_PAID',
    });

    // Verification endpoint returns payment record with lowercase status: 'paid'
    (transactionsApi.verifyPayment as any).mockResolvedValue({
      status: 'paid',
      data: {
        id: 202,
        amount: 1500000,
        status: 'paid',
        reference: 'PAY-REF-PAID',
      },
    });

    (paystackUtils.resumePaystackCheckout as any).mockImplementation((opts: any) => {
      opts.onSuccess('PAY-REF-PAID');
      return Promise.resolve();
    });

    renderComponent({ onSuccess: mockOnSuccess });

    await screen.findByText(/Debit \/ Credit Card/i);

    fireEvent.click(screen.getByRole('button', { name: /proceed to pay/i }));

    await waitFor(() => {
      expect(transactionsApi.verifyPayment).toHaveBeenCalledWith(42, 'PAY-REF-PAID');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles popup cancellation without marking transaction paid', async () => {
    const mockOnCancel = vi.fn();

    (transactionsApi.initializePayment as any).mockResolvedValue({
      reference: 'PAY-REF-CANCEL',
      accessCode: 'ACCESS_CODE_CANCEL',
    });

    (paystackUtils.resumePaystackCheckout as any).mockImplementation((opts: any) => {
      opts.onCancel();
      return Promise.resolve();
    });

    renderComponent({ onCancel: mockOnCancel });

    await screen.findByText(/Debit \/ Credit Card/i);

    fireEvent.click(screen.getByRole('button', { name: /proceed to pay/i }));

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
      expect(transactionsApi.verifyPayment).not.toHaveBeenCalled();
    });
  });
});
