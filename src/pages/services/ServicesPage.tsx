import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, CleaningService } from '../../api/configuration';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2, Clock } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CleaningService | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  // Load categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: () => configurationApi.getCategories(100, 0),
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services', limit, offset],
    queryFn: () => configurationApi.getServices(limit, offset),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setSlug('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setDurationMinutes(60);
    setDescription('');
    setImageUrl('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: CleaningService) => {
    setEditingService(srv);
    setName(srv.name);
    setSlug(srv.slug);
    setCategoryId(srv.categoryId);
    setDurationMinutes(srv.estimatedDurationMinutes);
    setDescription(srv.description || '');
    setImageUrl(srv.imageUrl || '');
    setActive(srv.active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!categoryId) throw new Error('Category selection is required');
      const payload = {
        name,
        slug,
        categoryId: Number(categoryId),
        estimatedDurationMinutes: Number(durationMinutes),
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        active,
      };
      if (editingService) {
        return configurationApi.updateService(editingService.id, payload);
      }
      return configurationApi.createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      addToast(
        'success',
        `Service ${editingService ? 'updated' : 'created'} successfully`
      );
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save service';
      addToast('error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !categoryId) return;
    saveMutation.mutate();
  };

  const autoGenerateSlug = (val: string) => {
    setName(val);
    if (!editingService) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const columns: Column<CleaningService>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Service Name',
      cell: (srv) => (
        <div className="font-semibold text-slate-900">{srv.name}</div>
      ),
    },
    { header: 'Slug', cell: (srv) => <code className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{srv.slug}</code> },
    {
      header: 'Category',
      cell: (srv) => {
        const cat = categories.find((c) => c.id === srv.categoryId);
        return <Badge variant="info">{cat ? cat.name : `Category #${srv.categoryId}`}</Badge>;
      },
    },
    {
      header: 'Est. Duration',
      cell: (srv) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{srv.estimatedDurationMinutes} mins</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (srv) => (
        <Badge variant={srv.active ? 'success' : 'neutral'}>
          {srv.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (srv) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(srv)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Cleaning Services"
      subtitle="Manage cleaning service offerings and duration estimates"
      action={
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Service
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={services}
          isLoading={isLoading}
          keyExtractor={(srv) => srv.id}
          emptyMessage="No cleaning services found."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={services.length}
          onOffsetChange={setOffset}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Cleaning Service' : 'Create Cleaning Service'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Name"
            value={name}
            onChange={(e) => autoGenerateSlug(e.target.value)}
            placeholder="e.g. Deep Home Cleaning"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. deep-home-cleaning"
            required
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            options={categories.map((c) => ({ value: c.id, label: `${c.name} ${!c.active ? '(Inactive)' : ''}` }))}
            placeholder="Select Category"
            required
          />

          <Input
            label="Estimated Duration (Minutes)"
            type="number"
            min={15}
            max={10080}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            placeholder="60"
            helperText="Estimated job completion duration used for scheduling overlap checks."
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
              placeholder="Detailed explanation of what this service covers..."
            />
          </div>

          <Input
            label="Image URL (Optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/service.jpg"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="srv-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="srv-active" className="text-sm font-medium text-slate-700">
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
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
