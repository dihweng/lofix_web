import React from 'react';
import { CustomerHeader } from './CustomerHeader';
import { CustomerFooter } from './CustomerFooter';
import { ToastContainer, ToastMessage } from '../common/Toast';

interface CustomerLayoutProps {
  children: React.ReactNode;
  toasts?: ToastMessage[];
  onDismissToast?: (id: string) => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  toasts = [],
  onDismissToast = () => {},
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <CustomerHeader />
      <main className="flex-grow">{children}</main>
      <CustomerFooter />
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
};
