import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, Category } from '../../api/configuration';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2, FolderTree } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories', limit, offset],
    queryFn: () => configurationApi.getCategories(limit, offset),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setActive(cat.active);
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
      if (editingCategory) {
        return configurationApi.updateCategory(editingCategory.id, payload);
      }
      return configurationApi.createCategory(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      addToast(
        'success',
        `Category ${editingCategory ? 'updated' : 'created'} successfully`
      );
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save category';
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
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const columns: Column<Category>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Name',
      cell: (cat) => (
        <div className="font-semibold text-slate-900">{cat.name}</div>
      ),
    },
    { header: 'Slug', cell: (cat) => <code className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{cat.slug}</code> },
    {
      header: 'Description',
      cell: (cat) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {cat.description || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (cat) => (
        <Badge variant={cat.active ? 'success' : 'neutral'}>
          {cat.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (cat) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(cat)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Categories"
      subtitle="Manage top-level cleaning service categories"
      action={
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={categories}
          isLoading={isLoading}
          keyExtractor={(cat) => cat.id}
          emptyMessage="No cleaning categories found."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={categories.length}
          onOffsetChange={setOffset}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => autoGenerateSlug(e.target.value)}
            placeholder="e.g. Residential Cleaning"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. residential-cleaning"
            helperText="Lowercase alphanumeric letters and hyphens only."
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
              placeholder="Brief description of the category..."
            />
          </div>

          <Input
            label="Image URL (Optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cat-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="cat-active" className="text-sm font-medium text-slate-700">
              Active (Visible in user catalog)
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
