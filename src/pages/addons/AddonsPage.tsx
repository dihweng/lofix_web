import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, Addon } from '../../api/configuration';
import { koboToNaira, nairaToKobo, formatNaira } from '../../utils/money';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2 } from 'lucide-react';

export const AddonsPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [nairaPrice, setNairaPrice] = useState<string>('0');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: addons = [], isLoading } = useQuery({
    queryKey: ['admin-addons', limit, offset],
    queryFn: () => configurationApi.getAddons(limit, offset),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingAddon(null);
    setName('');
    setSlug('');
    setNairaPrice('0');
    setDescription('');
    setImageUrl('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (addon: Addon) => {
    setEditingAddon(addon);
    setName(addon.name);
    setSlug(addon.slug);
    setNairaPrice(koboToNaira(addon.price).toString());
    setDescription(addon.description || '');
    setImageUrl(addon.imageUrl || '');
    setActive(addon.active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const priceInKobo = nairaToKobo(nairaPrice);
      const payload = {
        name,
        slug,
        price: priceInKobo,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        active,
      };
      if (editingAddon) {
        return configurationApi.updateAddon(editingAddon.id, payload);
      }
      return configurationApi.createAddon(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-addons'] });
      addToast(
        'success',
        `Add-on ${editingAddon ? 'updated' : 'created'} successfully`
      );
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save add-on';
      addToast('error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    saveMutation.mutate();
  };

  const autoGenerateSlug = (val: string) => {
    setName(val);
    if (!editingAddon) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const columns: Column<Addon>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Add-on Name',
      cell: (addon) => (
        <div className="font-semibold text-slate-900">{addon.name}</div>
      ),
    },
    { header: 'Slug', cell: (addon) => <code className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{addon.slug}</code> },
    {
      header: 'Price (NGN)',
      cell: (addon) => (
        <div className="font-semibold text-emerald-700 font-mono">
          {formatNaira(addon.price)}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (addon) => (
        <Badge variant={addon.active ? 'success' : 'neutral'}>
          {addon.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (addon) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(addon)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Add-ons"
      subtitle="Configure optional extra services and prices (e.g. Oven cleaning, Window wash)"
      action={
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Add-on
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={addons}
          isLoading={isLoading}
          keyExtractor={(addon) => addon.id}
          emptyMessage="No add-ons found."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={addons.length}
          onOffsetChange={setOffset}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Add-on Name"
            value={name}
            onChange={(e) => autoGenerateSlug(e.target.value)}
            placeholder="e.g. Oven Cleaning"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. oven-cleaning"
            required
          />

          <Input
            label="Price (in Naira ₦)"
            type="number"
            step="0.01"
            min="0"
            value={nairaPrice}
            onChange={(e) => setNairaPrice(e.target.value)}
            placeholder="5000"
            helperText={`Will be saved as ${nairaToKobo(nairaPrice)} integer kobo in API.`}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this add-on entails..."
            />
          </div>

          <Input
            label="Image URL (Optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/addon.jpg"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="addon-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="addon-active" className="text-sm font-medium text-slate-700">
              Active (Available for booking selection)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveMutation.isPending}
            >
              {editingAddon ? 'Save Changes' : 'Create Add-on'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
