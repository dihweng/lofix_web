import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi, Room, RoomPayload } from '../../api/apartments';
import { koboToNaira, formatNaira } from '../../utils/money';
import { PageLayout } from '../../components/layout/PageLayout';
import { Table, Column } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { ToastContainer, ToastMessage } from '../../components/common/Toast';
import { Plus, Edit2, Trash2, Building } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form State
  const [apartmentId, setApartmentId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bedType, setBedType] = useState<'SINGLE' | 'DOUBLE' | 'MULTIPLE'>('SINGLE');
  const [totalOccupancy, setTotalOccupancy] = useState<number>(1);
  const [nairaPrice, setNairaPrice] = useState<string>('20000');

  // Amenities
  const [hasPrivateToilet, setHasPrivateToilet] = useState(true);
  const [isPartyAllowed, setIsPartyAllowed] = useState(false);
  const [isLoudMusicAllowed, setIsLoudMusicAllowed] = useState(false);
  const [hasTv, setHasTv] = useState(true);
  const [hasKitchen, setHasKitchen] = useState(false);
  const [hasAirCon, setHasAirCon] = useState(true);
  const [hasHeating, setHasHeating] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);
  const [hasWater, setHasWater] = useState(true);
  const [hasLight, setHasLight] = useState(true);
  const [isListed, setIsListed] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const { data: apartments = [] } = useQuery({
    queryKey: ['admin-apartments-all'],
    queryFn: () => apartmentsApi.getApartments(),
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => apartmentsApi.getRooms(),
  });

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setApartmentId(apartments.length > 0 ? apartments[0].id : '');
    setTitle('');
    setDescription('');
    setBedType('SINGLE');
    setTotalOccupancy(1);
    setNairaPrice('20000');
    setHasPrivateToilet(true);
    setIsPartyAllowed(false);
    setIsLoudMusicAllowed(false);
    setHasTv(true);
    setHasKitchen(false);
    setHasAirCon(true);
    setHasHeating(false);
    setHasInternet(true);
    setHasWater(true);
    setHasLight(true);
    setIsListed(true);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setApartmentId(room.apartmentId);
    setTitle(room.title);
    setDescription(room.description);
    setBedType(room.bedType);
    setTotalOccupancy(room.totalOccupancy);
    setNairaPrice(koboToNaira(room.price).toString());
    setHasPrivateToilet(!!room.hasPrivateToilet);
    setIsPartyAllowed(!!room.isPartyAllowed);
    setIsLoudMusicAllowed(!!room.isLoudMusicAllowed);
    setHasTv(!!room.hasTv);
    setHasKitchen(!!room.hasKitchen);
    setHasAirCon(!!room.hasAirCon);
    setHasHeating(!!room.hasHeating);
    setHasInternet(!!room.hasInternet);
    setHasWater(!!room.hasWater);
    setHasLight(!!room.hasLight);
    setIsListed(room.isListed ?? true);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!apartmentId) throw new Error('Parent apartment is required');
      const payload: RoomPayload = {
        apartmentId: Number(apartmentId),
        title,
        description,
        bedType,
        totalOccupancy: Number(totalOccupancy),
        price: Number(nairaPrice),
        hasPrivateToilet,
        isPartyAllowed,
        isLoudMusicAllowed,
        hasTv,
        hasKitchen,
        hasAirCon,
        hasHeating,
        hasInternet,
        hasWater,
        hasLight,
        isListed,
      };

      if (editingRoom) {
        return apartmentsApi.updateRoom(editingRoom.id, payload);
      }
      return apartmentsApi.createRoom(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      addToast('success', `Room ${editingRoom ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save room';
      addToast('error', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apartmentsApi.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      addToast('success', 'Room deleted successfully');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete room';
      addToast('error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !apartmentId) return;
    saveMutation.mutate();
  };

  const columns: Column<Room>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Room Title',
      cell: (room) => (
        <div>
          <div className="font-semibold text-slate-900">{room.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Bed Type: {room.bedType} • Occupancy: {room.totalOccupancy} Max
          </div>
        </div>
      ),
    },
    {
      header: 'Parent Apartment',
      cell: (room) => {
        const apt = apartments.find((a) => a.id === room.apartmentId) || room.apartment;
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-800">{apt ? apt.title : `Apartment #${room.apartmentId}`}</span>
          </div>
        );
      },
    },
    {
      header: 'Daily Rate (NGN)',
      cell: (room) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(room.price)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (room) => (
        <Badge variant={room.isListed ? 'success' : 'neutral'}>
          {room.isListed ? 'Listed' : 'Unlisted'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (room) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(room)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Delete room "${room.title}"?`)) {
                deleteMutation.mutate(room.id);
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
      title="Rooms Management"
      subtitle="Configure individual shortlet rooms, parent apartments, pricing & amenities"
      action={
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Room
        </Button>
      }
    >
      <div className="space-y-4">
        <Table
          columns={columns}
          data={rooms}
          isLoading={isLoading}
          keyExtractor={(room) => room.id}
          emptyMessage="No rooms found."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Create Room'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Parent Apartment"
            value={apartmentId}
            onChange={(e) => setApartmentId(Number(e.target.value))}
            options={apartments.map((apt) => ({
              value: apt.id,
              label: `#${apt.id} — ${apt.title}`,
            }))}
            placeholder="Select Parent Apartment"
            required
          />

          <Input
            label="Room Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master Bedroom Suite"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Bed Type"
              value={bedType}
              onChange={(e) => setBedType(e.target.value as 'SINGLE' | 'DOUBLE' | 'MULTIPLE')}
              options={[
                { value: 'SINGLE', label: 'SINGLE' },
                { value: 'DOUBLE', label: 'DOUBLE' },
                { value: 'MULTIPLE', label: 'MULTIPLE' },
              ]}
              required
            />

            <Input
              label="Daily Rate (₦ Naira)"
              type="number"
              step="0.01"
              min="0"
              value={nairaPrice}
              onChange={(e) => setNairaPrice(e.target.value)}
              placeholder="20000"
              required
            />

            <Input
              label="Max Occupancy"
              type="number"
              min={1}
              max={100}
              value={totalOccupancy}
              onChange={(e) => setTotalOccupancy(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the room..."
              required
            />
          </div>

          {/* Amenities Grid */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Room Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasPrivateToilet} onChange={(e) => setHasPrivateToilet(e.target.checked)} /> Private Toilet
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasTv} onChange={(e) => setHasTv(e.target.checked)} /> TV
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasAirCon} onChange={(e) => setHasAirCon(e.target.checked)} /> Air Con
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasInternet} onChange={(e) => setHasInternet(e.target.checked)} /> WiFi
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasLight} onChange={(e) => setHasLight(e.target.checked)} /> 24/7 Power
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={isListed} onChange={(e) => setIsListed(e.target.checked)} /> Listed
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingRoom ? 'Save Changes' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </PageLayout>
  );
};
