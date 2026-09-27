import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MapPin, Navigation } from 'lucide-react';

export interface JobActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionName: string;
  onConfirm: (payload: { latitude?: number; longitude?: number; message?: string }) => void;
  isLoading?: boolean;
}

export const JobActionModal: React.FC<JobActionModalProps> = ({
  isOpen,
  onClose,
  title,
  actionName,
  onConfirm,
  isLoading = false,
}) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        (err) => {
          alert(`Unable to retrieve GPS location: ${err.message}`);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      message: message.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-700">
            <p className="font-semibold">GPS Coordinates (Optional)</p>
            <p className="text-slate-500">Share your current location for job tracking.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            leftIcon={<Navigation className="w-3.5 h-3.5 text-purple-600" />}
          >
            Get Location
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="e.g. 6.5244"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="e.g. 3.3792"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Status Note / Message (Optional)
          </label>
          <textarea
            className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            rows={3}
            placeholder="e.g. Traffic clear, arriving in 10 minutes..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            isLoading={isLoading}
          >
            Confirm {actionName}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
