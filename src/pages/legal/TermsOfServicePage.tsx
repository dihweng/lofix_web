import React from 'react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { ShieldCheck } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <CustomerLayout toasts={[]} onDismissToast={() => {}}>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Legal & Terms
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">Terms of Service</h1>
          <p className="text-xs text-slate-500">Last updated: October 2026</p>
        </div>

        <Card className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Lofix platform, you agree to be bound by these Terms of Service. If you do not agree to all terms, please do not use our services.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">2. Services & Transactions</h2>
          <p>
            Lofix provides shortlet apartment bookings, home cleaning calculation and scheduling, and instant utility bill payments (electricity tokens, mobile data, airtime, and cable TV). All transactions are processed securely in Nigerian Naira (NGN).
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">3. Utility Purchases & Delivery</h2>
          <p>
            Utility token purchases (Electricity, Data, Airtime, Cable TV) are fulfilled in real-time via VTpass. Once a token or service delivery is successfully completed, purchases are final. In case of vending delays or failed delivery, our automated support reconciliation workflow assists with manual resolution.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">4. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">5. Contact Information</h2>
          <p>
            For support or inquiries, reach out to us at support@lofix.ng.
          </p>
        </Card>
      </div>
    </CustomerLayout>
  );
};
