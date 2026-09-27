import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, PropertyType } from '../../api/configuration';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2 } from 'lucide-react';

export const PropertyTypesPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PropertyType | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: propertyTypes = [], isLoading } = useQuery({
    queryKey: ['admin-property-types', limit, offset],
    queryFn: () => configurationApi.getPropertyTypes(limit, offset),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PropertyType) => {
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
    setActive(item.active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        active,
      };
      if (editingItem) {
        return configurationApi.updatePropertyType(editingItem.id, payload);
      }
      return configurationApi.createPropertyType(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property-types'] });
      addToast(
        'success',
        `Property type ${editingItem ? 'updated' : 'created'} successfully`
      );
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save property type';
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
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const columns: Column<PropertyType>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Name',
      cell: (pt) => (
        <div className="font-semibold text-slate-900">{pt.name}</div>
      ),
    },
    { header: 'Slug', cell: (pt) => <code className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{pt.slug}</code> },
    {
      header: 'Description',
      cell: (pt) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {pt.description || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (pt) => (
        <Badge variant={pt.active ? 'success' : 'neutral'}>
          {pt.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (pt) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(pt)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Property Types"
      subtitle="Manage property classifications (e.g., Apartment, Villa, Office)"
      action={
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Property Type
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={propertyTypes}
          isLoading={isLoading}
          keyExtractor={(pt) => pt.id}
          emptyMessage="No property types found."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={propertyTypes.length}
          onOffsetChange={setOffset}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Property Type' : 'Create New Property Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Property Type Name"
            value={name}
            onChange={(e) => autoGenerateSlug(e.target.value)}
            placeholder="e.g. Apartment"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. apartment"
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
              placeholder="Brief description of property type..."
            />
          </div>

          <Input
            label="Image URL (Optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/property.jpg"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pt-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="pt-active" className="text-sm font-medium text-slate-700">
              Active (Available for booking)
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
              {editingItem ? 'Save Changes' : 'Create Property Type'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
