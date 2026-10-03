import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi, Apartment, ApartmentPayload } from '../../api/apartments';
import { authApi } from '../../api/auth';
import { koboToNaira, formatNaira } from '../../utils/money';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

export const ApartmentsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [purpose, setPurpose] = useState<'SHORTLET' | 'RENT' | 'SALE'>('SHORTLET');
  const [apartmentType, setApartmentType] = useState<'FLAT' | 'DUPLEX'>('FLAT');
  const [totalBedrooms, setTotalBedrooms] = useState<number>(1);
  const [totalOccupancy, setTotalOccupancy] = useState<number>(2);
  const [nairaPrice, setNairaPrice] = useState<string>('50000');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(6.5244);
  const [longitude, setLongitude] = useState<number>(3.3792);

  // Amenities
  const [isPartyAllowed, setIsPartyAllowed] = useState(false);
  const [hasTv, setHasTv] = useState(true);
  const [hasKitchen, setHasKitchen] = useState(true);
  const [hasAirCon, setHasAirCon] = useState(true);
  const [hasHeating, setHasHeating] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const [hasWater, setHasWater] = useState(true);
  const [hasLight, setHasLight] = useState(true);

  // Admin specific
  const [isListed, setIsListed] = useState(true);
  const [isActivated, setIsActivated] = useState(true);
  const [commission, setCommission] = useState<number>(0.1);
  const [ownerId, setOwnerId] = useState<number | ''>('');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ['admin-apartments'],
    queryFn: () => apartmentsApi.getApartments(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['admin-accounts-all'],
    queryFn: () => authApi.getAccounts(),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingApartment(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setPurpose('SHORTLET');
    setApartmentType('FLAT');
    setTotalBedrooms(1);
    setTotalOccupancy(2);
    setNairaPrice('50000');
    setAddress('');
    setLatitude(6.5244);
    setLongitude(3.3792);
    setIsPartyAllowed(false);
    setHasTv(true);
    setHasKitchen(true);
    setHasAirCon(true);
    setHasHeating(false);
    setHasInternet(true);
    setHasWater(true);
    setHasLight(true);
    setIsListed(true);
    setIsActivated(true);
    setCommission(0.1);
    setOwnerId(accounts.length > 0 ? accounts[0].id : '');
    setIsModalOpen(true);
  };

  const openEditModal = (apt: Apartment) => {
    setEditingApartment(apt);
    setTitle(apt.title);
    setDescription(apt.description);
    setImageUrl(apt.imageUrl || '');
    setPurpose((apt.purpose as any) || 'SHORTLET');
    setApartmentType(apt.apartmentType);
    setTotalBedrooms(apt.totalBedrooms);
    setTotalOccupancy(apt.totalOccupancy);
    setNairaPrice(koboToNaira(apt.price).toString());
    setAddress(apt.address);
    setLatitude(apt.latitude || 6.5244);
    setLongitude(apt.longitude || 3.3792);
    setIsPartyAllowed(!!apt.isPartyAllowed);
    setHasTv(!!apt.hasTv);
    setHasKitchen(!!apt.hasKitchen);
    setHasAirCon(!!apt.hasAirCon);
    setHasHeating(!!apt.hasHeating);
    setHasInternet(!!apt.hasInternet);
    setHasWater(!!apt.hasWater);
    setHasLight(!!apt.hasLight);
    setIsListed(apt.isListed ?? true);
    setIsActivated(apt.isActivated ?? true);
    setCommission(apt.commission ?? 0.1);
    setOwnerId(apt.ownerId || (accounts.length > 0 ? accounts[0].id : ''));
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: ApartmentPayload = {
        title,
        description,
        imageUrl: imageUrl === editingApartment?.imageUrl ? undefined : imageUrl || undefined,
        purpose,
        apartmentType,
        totalBedrooms: Number(totalBedrooms),
        totalOccupancy: Number(totalOccupancy),
        price: Number(nairaPrice),
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        isPartyAllowed,
        hasTv,
        hasKitchen,
        hasAirCon,
        hasHeating,
        hasInternet,
        hasWater,
        hasLight,
        isListed,
        isActivated,
        commission: Number(commission),
        ownerId: ownerId ? Number(ownerId) : undefined,
      };

      if (editingApartment) {
        return apartmentsApi.updateApartment(editingApartment.id, payload);
      }
      return apartmentsApi.createApartment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apartments'] });
      addToast('success', `Apartment ${editingApartment ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save apartment';
      addToast('error', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apartmentsApi.deleteApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apartments'] });
      addToast('success', 'Apartment deleted successfully');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete apartment';
      addToast('error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address) return;
    saveMutation.mutate();
  };

  const columns: Column<Apartment>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Apartment Title',
      cell: (apt) => (
        <div className="flex items-center gap-3">
          {apt.imageUrl && (
            <img src={apt.imageUrl} alt={apt.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          )}
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <span>{apt.title}</span>
              <Badge variant="primary" size="sm">
                {apt.purpose || 'SHORTLET'}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" /> {apt.address}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type / Bedrooms',
      cell: (apt) => (
        <span className="text-xs font-medium text-slate-700">
          {apt.apartmentType} • {apt.totalBedrooms} Beds ({apt.totalOccupancy} Max)
        </span>
      ),
    },
    {
      header: 'Daily Rate (NGN)',
      cell: (apt) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(apt.price)}
        </span>
      ),
    },
    {
      header: 'Listed / Activated',
      cell: (apt) => (
        <div className="flex gap-1">
          <Badge variant={apt.isListed ? 'success' : 'neutral'}>
            {apt.isListed ? 'Listed' : 'Unlisted'}
          </Badge>
          <Badge variant={apt.isActivated ? 'info' : 'danger'}>
            {apt.isActivated ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (apt) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(apt)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Delete apartment "${apt.title}"?`)) {
                deleteMutation.mutate(apt.id);
              }
            }}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title="Apartment Shortlets"
      subtitle="Manage shortlet apartment listings, rates, activation & owner accounts"
      action={
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Apartment
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={apartments}
          isLoading={isLoading}
          keyExtractor={(apt) => apt.id}
          emptyMessage="No shortlet apartments found."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingApartment ? 'Edit Shortlet Apartment' : 'Create Shortlet Apartment'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Apartment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Luxury 2-Bedroom Duplex in Ikoyi"
            required
          />

          <Input
            label="Image URL (Optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/apartment-image.jpg"
          />

          <Select
            label="Listing Category / Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as 'SHORTLET' | 'RENT' | 'SALE')}
            options={[
              { value: 'SHORTLET', label: 'Shortlet Stay — Book & Pay Instantly' },
              { value: 'RENT', label: 'For Rent — Contact Agent / Enquire' },
              { value: 'SALE', label: 'For Sale — Contact Agent / Enquire' },
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Apartment Structure Type"
              value={apartmentType}
              onChange={(e) => setApartmentType(e.target.value as 'FLAT' | 'DUPLEX')}
              options={[
                { value: 'FLAT', label: 'FLAT' },
                { value: 'DUPLEX', label: 'DUPLEX' },
              ]}
              required
            />

            <Input
              label="Rate (₦ Naira)"
              type="number"
              step="0.01"
              min="0"
              value={nairaPrice}
              onChange={(e) => setNairaPrice(e.target.value)}
              placeholder="50000"
              required
            />

            <Input
              label="Total Bedrooms"
              type="number"
              min={1}
              max={20}
              value={totalBedrooms}
              onChange={(e) => setTotalBedrooms(Number(e.target.value))}
              required
            />

            <Input
              label="Total Max Occupancy"
              type="number"
              min={1}
              max={100}
              value={totalOccupancy}
              onChange={(e) => setTotalOccupancy(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 15 Admiralty Way, Lekki Phase 1, Lagos"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed property description, amenities, and house rules..."
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Party Allowed', state: isPartyAllowed, setter: setIsPartyAllowed },
              { label: 'TV', state: hasTv, setter: setHasTv },
              { label: 'Kitchen', state: hasKitchen, setter: setHasKitchen },
              { label: 'Air Con', state: hasAirCon, setter: setHasAirCon },
              { label: 'Heating', state: hasHeating, setter: setHasHeating },
              { label: 'Internet', state: hasInternet, setter: setHasInternet },
              { label: 'Water', state: hasWater, setter: setHasWater },
              { label: 'Light (24/7)', state: hasLight, setter: setHasLight },
            ].map((amenity, idx) => (
              <label key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenity.state}
                  onChange={(e) => amenity.setter(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>{amenity.label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Select
              label="Account Owner / Host"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Select owner account...' },
                ...accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.firstName} ${acc.lastName} (${acc.email})`,
                })),
              ]}
            />

            <Input
              label="Platform Commission (e.g. 0.1 for 10%)"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isListed}
                onChange={(e) => setIsListed(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Listed Publicly</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActivated}
                onChange={(e) => setIsActivated(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saveMutation.isPending}>
              {editingApartment ? 'Update Apartment' : 'Create Apartment'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={addToast} />
    </PageLayout>
  );
};
