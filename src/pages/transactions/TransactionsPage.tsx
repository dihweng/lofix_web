import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  transactionsApi,
  SystemTransaction,
  TransactionType,
  TransactionReceipt,
} from '../../api/transactions';
import { formatNaira } from '../../utils/money';
import { formatDate } from '../../utils/formatters';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Receipt, Search, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-transactions-all'],
    queryFn: () => transactionsApi.getAdminTransactions(),
  });

  const { data: receipt, isLoading: isReceiptLoading } = useQuery<TransactionReceipt>({
    queryKey: ['admin-transaction-receipt', selectedTransactionId],
    queryFn: () => transactionsApi.getTransactionReceipt(selectedTransactionId!),
    enabled: !!selectedTransactionId,
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = !typeFilter || t.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.reference.toLowerCase().includes(q) ||
      (t.account &&
        (`${t.account.firstName} ${t.account.lastName}`.toLowerCase().includes(q) ||
          t.account.email.toLowerCase().includes(q)));
    return matchesType && matchesSearch;
  });

  const columns: Column<SystemTransaction>[] = [
    {
      header: 'Reference',
      cell: (t) => (
        <div>
          <div className="font-mono font-bold text-xs text-slate-900">{t.reference}</div>
          <div className="text-[10px] text-slate-400 font-mono">ID: #{t.id}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (t) => (
        <div>
          <div className="font-semibold text-slate-900">
            {t.account ? `${t.account.firstName} ${t.account.lastName}` : `Account #${t.accountId}`}
          </div>
          <div className="text-xs text-slate-500 font-mono">{t.account?.email || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Amount (NGN)',
      cell: (t) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(t.amount)}
        </span>
      ),
    },
    {
      header: 'Type',
      cell: (t) => {
        const variants: Record<TransactionType, 'info' | 'neutral' | 'warning'> = {
          ACCOMMODATION: 'info',
          HOME_SERVICE: 'warning',
          BILL: 'neutral',
        };
        return <Badge variant={variants[t.type] || 'neutral'}>{t.type}</Badge>;
      },
    },
    {
      header: 'Status',
      cell: (t) => {
        const variants = {
          PENDING: 'warning' as const,
          COMPLETED: 'success' as const,
          FAILED: 'danger' as const,
        };
        return <Badge variant={variants[t.status]}>{t.status}</Badge>;
      },
    },
    {
      header: 'Date',
      cell: (t) => (
        <span className="text-xs text-slate-600">{formatDate(t.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      cell: (t) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTransactionId(t.id)}
          leftIcon={<Receipt className="w-3.5 h-3.5" />}
        >
          View Receipt
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Transactions & Payments"
      subtitle="Inspect system transactions, payment statuses, and official customer receipts"
    >
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search reference, name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
                options={[
                  { value: 'ACCOMMODATION', label: 'ACCOMMODATION' },
                  { value: 'HOME_SERVICE', label: 'HOME_SERVICE' },
                  { value: 'BILL', label: 'BILL' },
                ]}
                placeholder="All Transaction Types"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredTransactions.length}</strong> transactions
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredTransactions}
          isLoading={isLoading}
          keyExtractor={(t) => t.id}
          emptyMessage="No system transactions found matching search."
        />
      </div>

      {/* Receipt Modal */}
      {selectedTransactionId && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTransactionId(null)}
          title="Transaction Receipt"
        >
          {isReceiptLoading || !receipt ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700 font-mono">
              {/* Receipt Header */}
              <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-1">
                <p className="text-base font-extrabold tracking-wider text-emerald-400">
                  {receipt.branding.name.toUpperCase()} RECEIPT
                </p>
                <p className="text-[11px] text-slate-400">Ref: {receipt.transaction.reference}</p>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-800">Payment Status</span>
                <Badge variant={receipt.transaction.status === 'COMPLETED' ? 'success' : receipt.transaction.status === 'FAILED' ? 'danger' : 'warning'}>
                  {receipt.transaction.status}
                </Badge>
              </div>

              {/* Details Breakdown */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{receipt.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span>{receipt.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Type:</span>
                  <span className="font-bold text-emerald-700">{receipt.transaction.type}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Amount:</span>
                  <span className="text-emerald-700 font-extrabold">
                    ₦{Number(receipt.transaction.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Type Details */}
              {receipt.details && Object.keys(receipt.details).length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Linked Specifics
                  </p>
                  {Object.entries(receipt.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-slate-800">{String(val ?? '—')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTransactionId(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </PageLayout>
  );
};
