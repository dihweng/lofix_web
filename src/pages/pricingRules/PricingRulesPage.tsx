import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationApi, PricingRule } from '../../api/configuration';
import { koboToNaira, nairaToKobo, formatNaira } from '../../utils/money';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2, Info } from 'lucide-react';

export const PricingRulesPage: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Form State (All price fields in Naira string for form inputs)
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [propertyTypeId, setPropertyTypeId] = useState<number | ''>('');
  const [basePrice, setBasePrice] = useState<string>('1000');
  const [pricePerRoom, setPricePerRoom] = useState<string>('100');
  const [pricePerBathroom, setPricePerBathroom] = useState<string>('50');
  const [pricePerFloor, setPricePerFloor] = useState<string>('0');
  const [pricePerSqMeter, setPricePerSqMeter] = useState<string>('0');
  const [minimumPrice, setMinimumPrice] = useState<string>('1000');
  const [serviceFee, setServiceFee] = useState<string>('0');
  const [active, setActive] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  // Load services and property types for dropdowns
  const { data: services = [] } = useQuery({
    queryKey: ['admin-services-all'],
    queryFn: () => configurationApi.getServices(100, 0),
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ['admin-property-types-all'],
    queryFn: () => configurationApi.getPropertyTypes(100, 0),
  });

  const { data: pricingRules = [], isLoading } = useQuery({
    queryKey: ['admin-pricing-rules', limit, offset],
    queryFn: () => configurationApi.getPricingRules(limit, offset),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setServiceId(services.length > 0 ? services[0].id : '');
    setPropertyTypeId(propertyTypes.length > 0 ? propertyTypes[0].id : '');
    setBasePrice('1000');
    setPricePerRoom('100');
    setPricePerBathroom('50');
    setPricePerFloor('0');
    setPricePerSqMeter('0');
    setMinimumPrice('1000');
    setServiceFee('0');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule);
    setServiceId(rule.serviceId);
    setPropertyTypeId(rule.propertyTypeId);
    setBasePrice(koboToNaira(rule.basePrice).toString());
    setPricePerRoom(koboToNaira(rule.pricePerRoom).toString());
    setPricePerBathroom(koboToNaira(rule.pricePerBathroom).toString());
    setPricePerFloor(koboToNaira(rule.pricePerFloor).toString());
    setPricePerSqMeter(koboToNaira(rule.pricePerSqMeter).toString());
    setMinimumPrice(koboToNaira(rule.minimumPrice).toString());
    setServiceFee(koboToNaira(rule.serviceFee).toString());
    setActive(rule.active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || !propertyTypeId) {
        throw new Error('Service and Property Type selections are required');
      }
      const payload = {
        serviceId: Number(serviceId),
        propertyTypeId: Number(propertyTypeId),
        basePrice: nairaToKobo(basePrice),
        pricePerRoom: nairaToKobo(pricePerRoom),
        pricePerBathroom: nairaToKobo(pricePerBathroom),
        pricePerFloor: nairaToKobo(pricePerFloor),
        pricePerSqMeter: nairaToKobo(pricePerSqMeter),
        minimumPrice: nairaToKobo(minimumPrice),
        serviceFee: nairaToKobo(serviceFee),
        currency: 'NGN' as const,
        active,
      };
      if (editingRule) {
        return configurationApi.updatePricingRule(editingRule.id, payload);
      }
      return configurationApi.createPricingRule(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-rules'] });
      addToast(
        'success',
        `Pricing rule ${editingRule ? 'updated' : 'created'} successfully`
      );
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save pricing rule';
      addToast('error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !propertyTypeId) return;
    saveMutation.mutate();
  };

  const columns: Column<PricingRule>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Service / Property Pair',
      cell: (rule) => {
        const srv = services.find((s) => s.id === rule.serviceId);
        const pt = propertyTypes.find((p) => p.id === rule.propertyTypeId);
        return (
          <div>
            <div className="font-semibold text-slate-900">{srv ? srv.name : `Service #${rule.serviceId}`}</div>
            <div className="text-xs text-slate-500 mt-0.5">{pt ? pt.name : `PropertyType #${rule.propertyTypeId}`}</div>
          </div>
        );
      },
    },
    {
      header: 'Base Price',
      cell: (rule) => (
        <span className="font-semibold text-emerald-700 font-mono text-xs">
          {formatNaira(rule.basePrice)}
        </span>
      ),
    },
    {
      header: 'Room / Bath Charges',
      cell: (rule) => (
        <div className="text-xs text-slate-600 font-mono space-y-0.5">
          <div>Room: {formatNaira(rule.pricePerRoom)}</div>
          <div>Bath: {formatNaira(rule.pricePerBathroom)}</div>
        </div>
      ),
    },
    {
      header: 'Minimum Price',
      cell: (rule) => (
        <span className="font-mono text-xs text-slate-700">
          {formatNaira(rule.minimumPrice)}
        </span>
      ),
    },
    {
      header: 'Service Fee',
      cell: (rule) => (
        <span className="font-mono text-xs text-slate-700">
          {formatNaira(rule.serviceFee)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (rule) => (
        <Badge variant={rule.active ? 'success' : 'neutral'}>
          {rule.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (rule) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(rule)}
          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout
      title="Pricing Rules"
      subtitle="Configure pricing formulas for Service & Property Type combinations"
      action={
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Pricing Rule
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Helper Callout explaining backend pricing logic */}
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sky-950">Pricing Rule Calculation Formula</p>
            <p className="mt-0.5 text-sky-800">
              Total = <code className="bg-sky-100 px-1 rounded font-mono">MAX(Base + Room*N + Bath*N + Floor*N + Sqm*N, Minimum) + Addons + ServiceFee</code>.
              Only 1 editable pricing rule is allowed per service & property type pair. Deactivate rules to disable booking for that pair.
            </p>
          </div>
        </div>

        <Table
          columns={columns}
          data={pricingRules}
          isLoading={isLoading}
          keyExtractor={(rule) => rule.id}
          emptyMessage="No pricing rules configured."
        />

        <Pagination
          offset={offset}
          limit={limit}
          totalCountOnPage={pricingRules.length}
          onOffsetChange={setOffset}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Service"
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select Service"
              required
            />

            <Select
              label="Property Type"
              value={propertyTypeId}
              onChange={(e) => setPropertyTypeId(Number(e.target.value))}
              options={propertyTypes.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Select Property Type"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Price Components (Naira ₦)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Price (₦)"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />

              <Input
                label="Minimum Price (₦)"
                type="number"
                step="0.01"
                min="0"
                value={minimumPrice}
                onChange={(e) => setMinimumPrice(e.target.value)}
                required
              />

              <Input
                label="Price Per Room (₦)"
                type="number"
                step="0.01"
                min="0"
                value={pricePerRoom}
                onChange={(e) => setPricePerRoom(e.target.value)}
              />

              <Input
                label="Price Per Bathroom (₦)"
                type="number"
                step="0.01"
                min="0"
                value={pricePerBathroom}
                onChange={(e) => setPricePerBathroom(e.target.value)}
              />

              <Input
                label="Price Per Floor (₦)"
                type="number"
                step="0.01"
                min="0"
                value={pricePerFloor}
                onChange={(e) => setPricePerFloor(e.target.value)}
              />

              <Input
                label="Price Per Sq. Metre (₦)"
                type="number"
                step="0.01"
                min="0"
                value={pricePerSqMeter}
                onChange={(e) => setPricePerSqMeter(e.target.value)}
              />

              <Input
                label="Service Fee (₦)"
                type="number"
                step="0.01"
                min="0"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                helperText="Fixed service fee added to final price."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="rule-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="rule-active" className="text-sm font-medium text-slate-700">
              Active (Use rule in price calculations)
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
              {editingRule ? 'Save Changes' : 'Create Pricing Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
