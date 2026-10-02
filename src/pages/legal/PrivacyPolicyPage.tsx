import React from 'react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <CustomerLayout toasts={[]} onDismissToast={() => {}}>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Legal & Privacy
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">Privacy Policy</h1>
          <p className="text-xs text-slate-500">Last updated: October 2026</p>
        </div>

        <Card className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <h2 className="text-sm font-bold text-slate-900">1. Introduction</h2>
          <p>
            Lofix Homes & Services ("we", "our", or "us") respects your privacy and is committed to protecting your personal data in compliance with NDPR and applicable data protection regulations. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application and services.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when registering, booking shortlets, calculating cleaning services, or purchasing utility tokens. This includes your name, email address, phone number, property addresses, and payment transaction references processed securely via Paystack.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">3. How We Use Your Information</h2>
          <p>
            Your information is used to facilitate bookings, process utility purchases with VTpass, provide customer support, verify accounts, and improve our platform experience. We never sell your personal data to third parties.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">4. Data Security</h2>
          <p>
            We implement robust security measures including HTTPS encryption, secure HTTP-only cookies, and encrypted authentication tokens to protect your personal and financial data.
          </p>

          <h2 className="text-sm font-bold text-slate-900 pt-2">5. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy, please contact our privacy team at support@lofix.ng.
          </p>
        </Card>
      </div>
    </CustomerLayout>
  );
};
