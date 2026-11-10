import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { CleaningBooking, ContactPreference } from '../../api/bookings';
import { AlertCircle, MapPin } from 'lucide-react';

interface Props {
  booking: CleaningBooking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ArrivalDetailsModal: React.FC<Props> = ({ booking, onClose, onSuccess }) => {
  const [instructions, setInstructions] = useState('');
  const [landmark, setLandmark] = useState('');
  const [preference, setPreference] = useState<ContactPreference>('CALL');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking) return;
    setInstructions(booking.arrivalInstructions || '');
    setLandmark(booking.accessLandmark || '');
    setPreference(booking.contactPreference || 'CALL');
    setPhone(booking.contactPhoneNumber || '');
    setError('');
  }, [booking]);

  if (!booking) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await cleaningCustomerApi.updateArrivalDetails(booking.id, {
        arrivalInstructions: instructions.trim(), accessLandmark: landmark.trim(),
        contactPreference: preference, contactPhoneNumber: phone.trim()
      });
      onSuccess(); onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not update arrival details.');
    } finally { setSaving(false); }
  };

  return <Modal isOpen={!!booking} onClose={onClose} title="Arrival instructions" maxWidth="lg">
    <form onSubmit={submit} className="space-y-4">
      {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <Input label="Arrival Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Call at the gate or ask security for the apartment" />
      <Input label="Landmark / Gate Directions" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Blue gate opposite the pharmacy" leftIcon={<MapPin className="w-4 h-4" />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Preferred Contact Method" value={preference} onChange={e => setPreference(e.target.value as ContactPreference)} options={[{ value: 'CALL', label: 'Phone call' }, { value: 'SMS', label: 'SMS message' }]} />
        <Input label="Arrival Contact Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} helperText="Shared with the assigned Agent only after acceptance." />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={saving}>Save instructions</Button></div>
    </form>
  </Modal>;
};
