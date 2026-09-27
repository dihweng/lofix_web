import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi, Apartment, Room, ApartmentPayload, RoomPayload } from '../../../api/apartments';
import { shortletBookingsApi, ShortletBooking } from '../../../api/shortletBookings';
import { formatNaira } from '../../../utils/money';
import { formatDate } from '../../../utils/formatters';
import { Table, Column } from '../../../components/common/Table';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import { ToastContainer, ToastMessage } from '../../../components/common/Toast';
import { Home, Building, Calendar, Plus, MapPin } from 'lucide-react';

export const RentalListingsTab: React.FC = () => {
  const [activeSection, setActiveSubSection] = useState<'apartments' | 'rooms' | 'bookings'>('apartments');

  // Modals
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Apartment Form State
  const [aptTitle, setAptTitle] = useState('');
  const [aptDesc, setAptDesc] = useState('');
  const [aptPurpose, setAptPurpose] = useState<'SHORTLET' | 'RENT' | 'SALE'>('SHORTLET');
  const [aptType, setAptType] = useState<'FLAT' | 'DUPLEX'>('FLAT');
  const [aptBedrooms, setAptBedrooms] = useState(1);
  const [aptOccupancy, setAptOccupancy] = useState(2);
  const [aptNairaPrice, setAptNairaPrice] = useState('40000');
  const [aptAddress, setAptAddress] = useState('');

  // Room Form State
  const [roomApartmentId, setRoomApartmentId] = useState<number | ''>('');
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomBedType, setRoomBedType] = useState<'SINGLE' | 'DOUBLE' | 'MULTIPLE'>('SINGLE');
  const [roomOccupancy, setRoomOccupancy] = useState(1);
  const [roomNairaPrice, setRoomNairaPrice] = useState('18000');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const queryClient = useQueryClient();

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Queries
  const { data: apartments = [], isLoading: isAptsLoading } = useQuery<Apartment[]>({
    queryKey: ['agent-managed-apartments'],
    queryFn: () => apartmentsApi.getApartments(),
  });

  const { data: rooms = [], isLoading: isRoomsLoading } = useQuery<Room[]>({
    queryKey: ['agent-managed-rooms'],
    queryFn: () => apartmentsApi.getRooms(),
  });

  const { data: tenantBookings = [], isLoading: isBookingsLoading } = useQuery<ShortletBooking[]>({
    queryKey: ['agent-tenant-bookings'],
    queryFn: () => shortletBookingsApi.getShortletBookings(),
  });

  // Create Apartment Mutation
  const createAptMutation = useMutation({
    mutationFn: async () => {
      const payload: ApartmentPayload = {
        title: aptTitle,
        description: aptDesc,
        purpose: aptPurpose,
        apartmentType: aptType,
        totalBedrooms: Number(aptBedrooms),
        totalOccupancy: Number(aptOccupancy),
        price: Number(aptNairaPrice),
        address: aptAddress,
        latitude: 6.5244,
        longitude: 3.3792,
        isListed: false, // Unlisted until Admin activates
      };
      return apartmentsApi.createApartment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-managed-apartments'] });
      addToast('success', 'Apartment created! Pending Admin approval & listing.');
      setIsAptModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create apartment';
      addToast('error', msg);
    },
  });

  // Create Room Mutation
  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (!roomApartmentId) throw new Error('Select parent apartment');
      const payload: RoomPayload = {
        apartmentId: Number(roomApartmentId),
        title: roomTitle,
        description: roomDesc,
        bedType: roomBedType,
        totalOccupancy: Number(roomOccupancy),
        price: Number(roomNairaPrice),
        isListed: false,
      };
      return apartmentsApi.createRoom(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-managed-rooms'] });
      addToast('success', 'Room created! Pending Admin approval.');
      setIsRoomModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create room';
      addToast('error', msg);
    },
  });

  const aptColumns: Column<Apartment>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Title & Category',
      cell: (apt) => (
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
      ),
    },
    {
      header: 'Rate (NGN)',
      cell: (apt) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(apt.price)}
        </span>
      ),
    },
    {
      header: 'Listing Status',
      cell: (apt) => (
        <Badge variant={apt.isListed ? 'success' : 'neutral'}>
          {apt.isListed ? 'Listed' : 'Unlisted / Pending Approval'}
        </Badge>
      ),
    },
  ];

  const roomColumns: Column<Room>[] = [
    { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
    {
      header: 'Room Title',
      cell: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.title}</div>
          <div className="text-xs text-slate-500 font-mono">Bed: {r.bedType}</div>
        </div>
      ),
    },
    {
      header: 'Rate (NGN)',
      cell: (r) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(r.price)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.isListed ? 'success' : 'neutral'}>
          {r.isListed ? 'Listed' : 'Unlisted'}
        </Badge>
      ),
    },
  ];

  const bookingColumns: Column<ShortletBooking>[] = [
    {
      header: 'Booking ID',
      cell: (b) => (
        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
          #{b.id}
        </span>
      ),
    },
    {
      header: 'Tenant Customer',
      cell: (b) => (
        <div>
          <div className="font-semibold text-slate-900">
            {b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : `Customer #${b.customerId}`}
          </div>
          <div className="text-xs text-slate-500 font-mono">{b.customer?.phoneNumber || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Stay Period',
      cell: (b) => (
        <div className="text-xs font-medium text-slate-700">
          <div>{formatDate(b.startDate)} → {formatDate(b.endDate)}</div>
          <div className="text-slate-500 font-mono">({b.days} days)</div>
        </div>
      ),
    },
    {
      header: 'Cost (NGN)',
      cell: (b) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatNaira(b.totalCost)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (b) => (
        <Badge variant={b.status === 'OPEN' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'warning'}>
          {b.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubSection('apartments')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeSection === 'apartments'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> My Apartments ({apartments.length})
          </button>
          <button
            onClick={() => setActiveSubSection('rooms')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeSection === 'rooms'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> My Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveSubSection('bookings')}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeSection === 'bookings'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Tenant Bookings ({tenantBookings.length})
          </button>
        </div>

        <div>
          {activeSection === 'apartments' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAptTitle('');
                setAptDesc('');
                setAptAddress('');
                setAptPurpose('SHORTLET');
                setIsAptModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Apartment
            </Button>
          )}

          {activeSection === 'rooms' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setRoomApartmentId(apartments.length > 0 ? apartments[0].id : '');
                setRoomTitle('');
                setRoomDesc('');
                setIsRoomModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Room
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: APARTMENTS */}
      {activeSection === 'apartments' && (
        <Table
          columns={aptColumns}
          data={apartments}
          isLoading={isAptsLoading}
          keyExtractor={(apt) => apt.id}
          emptyMessage="You currently have no managed shortlet apartments."
        />
      )}

      {/* SECTION 2: ROOMS */}
      {activeSection === 'rooms' && (
        <Table
          columns={roomColumns}
          data={rooms}
          isLoading={isRoomsLoading}
          keyExtractor={(r) => r.id}
          emptyMessage="You currently have no managed shortlet rooms."
        />
      )}

      {/* SECTION 3: BOOKINGS */}
      {activeSection === 'bookings' && (
        <Table
          columns={bookingColumns}
          data={tenantBookings}
          isLoading={isBookingsLoading}
          keyExtractor={(b) => b.id}
          emptyMessage="No tenant rental bookings recorded for your properties."
        />
      )}

      {/* Add Apartment Modal */}
      <Modal
        isOpen={isAptModalOpen}
        onClose={() => setIsAptModalOpen(false)}
        title="Add Agent Apartment Listing"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAptMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Apartment Title"
            value={aptTitle}
            onChange={(e) => setAptTitle(e.target.value)}
            placeholder="e.g. Modern Studio Flat"
            required
          />

          <Select
            label="Listing Category / Purpose"
            value={aptPurpose}
            onChange={(e) => setAptPurpose(e.target.value as 'SHORTLET' | 'RENT' | 'SALE')}
            options={[
              { value: 'SHORTLET', label: 'Shortlet Stay — Book & Pay Instantly' },
              { value: 'RENT', label: 'For Rent — Contact Agent / Enquire' },
              { value: 'SALE', label: 'For Sale — Contact Agent / Enquire' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={aptType}
              onChange={(e) => setAptType(e.target.value as 'FLAT' | 'DUPLEX')}
              options={[
                { value: 'FLAT', label: 'FLAT' },
                { value: 'DUPLEX', label: 'DUPLEX' },
              ]}
              required
            />
            <Input
              label="Rate (₦ Naira)"
              type="number"
              value={aptNairaPrice}
              onChange={(e) => setAptNairaPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bedrooms"
              type="number"
              value={aptBedrooms}
              onChange={(e) => setAptBedrooms(Number(e.target.value))}
              required
            />
            <Input
              label="Max Occupancy"
              type="number"
              value={aptOccupancy}
              onChange={(e) => setAptOccupancy(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="Address"
            value={aptAddress}
            onChange={(e) => setAptAddress(e.target.value)}
            placeholder="Property address..."
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              rows={3}
              value={aptDesc}
              onChange={(e) => setAptDesc(e.target.value)}
              placeholder="Description..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-700 font-bold"
              isLoading={createAptMutation.isPending}
            >
              Submit Listing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title="Add Shortlet Room"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRoomMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Parent Apartment"
            value={roomApartmentId}
            onChange={(e) => setRoomApartmentId(Number(e.target.value))}
            options={apartments.map((a) => ({ value: a.id, label: `#${a.id} — ${a.title}` }))}
            placeholder="Choose Parent Apartment"
            required
          />

          <Input
            label="Room Title"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            placeholder="e.g. Bedroom A"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Bed Type"
              value={roomBedType}
              onChange={(e) => setRoomBedType(e.target.value as 'SINGLE' | 'DOUBLE' | 'MULTIPLE')}
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
              value={roomNairaPrice}
              onChange={(e) => setRoomNairaPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              rows={3}
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
              placeholder="Description..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-700 font-bold"
              isLoading={createRoomMutation.isPending}
            >
              Submit Room Listing
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
};
