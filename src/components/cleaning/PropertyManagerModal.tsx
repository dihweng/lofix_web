import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { cleaningCustomerApi, SavedProperty } from '../../api/cleaningCustomer';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, MapPin, Building, Check, AlertCircle, Info } from 'lucide-react';

interface PropertyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyManagerModal: React.FC<PropertyManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: properties = [], refetch } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: cleaningCustomerApi.getSavedProperties,
    enabled: isOpen,
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ['propertyTypes'],
    queryFn: cleaningCustomerApi.getPropertyTypes,
    enabled: isOpen,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState('My Home');
  const [propertyTypeId, setPropertyTypeId] = useState<number>(1);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [country, setCountry] = useState('Nigeria');
  const [numberOfBedrooms, setNumberOfBedrooms] = useState<number>(2);
  const [numberOfLivingRooms, setNumberOfLivingRooms] = useState<number>(1);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState<number>(2);
  const [numberOfFloors, setNumberOfFloors] = useState<number>(1);
  const [dontKnowArea, setDontKnowArea] = useState<boolean>(true);
  const [squareMetersInput, setSquareMetersInput] = useState<string>('100');
  const [accessInstructions, setAccessInstructions] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startNewForm = () => {
    setIsEditing(true);
    setEditingId(null);
    setName('Home Address');
    setAddressLine1('');
    setAddressLine2('');
    setCity('Lagos');
    setState('Lagos');
    setNumberOfBedrooms(2);
    setNumberOfLivingRooms(1);
    setNumberOfBathrooms(2);
    setNumberOfFloors(1);
    setDontKnowArea(true);
    setSquareMetersInput('100');
    setErrorMsg(null);
  };

  const startEditForm = (prop: SavedProperty) => {
    setIsEditing(true);
    setEditingId(prop.id);
    setName(prop.name);
    setPropertyTypeId(prop.propertyTypeId);
    setAddressLine1(prop.addressLine1);
    setAddressLine2(prop.addressLine2 || '');
    setCity(prop.city);
    setState(prop.state);
    setCountry(prop.country || 'Nigeria');

    if (prop.numberOfBedrooms !== undefined && prop.numberOfBedrooms !== null) {
      setNumberOfBedrooms(prop.numberOfBedrooms);
      setNumberOfLivingRooms(prop.numberOfLivingRooms || 0);
    } else {
      // Legacy property total
      setNumberOfBedrooms(prop.numberOfRooms || 2);
      setNumberOfLivingRooms(0);
    }

    setNumberOfBathrooms(prop.numberOfBathrooms);
    setNumberOfFloors(prop.numberOfFloors);

    if (prop.squareMeters !== undefined && prop.squareMeters !== null && prop.squareMeters > 0) {
      setDontKnowArea(false);
      setSquareMetersInput(String(prop.squareMeters));
    } else {
      setDontKnowArea(true);
      setSquareMetersInput('100');
    }

    setAccessInstructions(prop.accessInstructions || '');
    setErrorMsg(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this property address?')) return;
    try {
      await cleaningCustomerApi.deleteSavedProperty(id);
      refetch();
    } catch {
      alert('Failed to delete property.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !addressLine1.trim() || !city.trim()) {
      setErrorMsg('Please enter a property label, address, and city.');
      return;
    }

    setIsLoading(true);

    try {
      const sqMetersValue = dontKnowArea ? null : (parseInt(squareMetersInput, 10) || null);

      const payload = {
        name: name.trim(),
        propertyTypeId: Number(propertyTypeId) || 1,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || 'Nigeria',
        numberOfBedrooms: Number(numberOfBedrooms),
        numberOfLivingRooms: Number(numberOfLivingRooms),
        numberOfBathrooms: Number(numberOfBathrooms),
        numberOfFloors: Number(numberOfFloors),
        squareMeters: sqMetersValue,
        accessInstructions: accessInstructions.trim() || undefined,
      };

      if (editingId) {
        await cleaningCustomerApi.updateSavedProperty(editingId, payload);
      } else {
        await cleaningCustomerApi.createSavedProperty(payload);
      }

      refetch();
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save property address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Property Address Manager"
      maxWidth="lg"
    >
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Manage saved properties for one-click cleaning bookings.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={startNewForm}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Address
            </Button>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No saved property address yet.</p>
              <Button variant="outline" size="sm" onClick={startNewForm} className="mt-2">
                Add Property
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {properties.map((prop) => {
                const hasSplit = prop.numberOfBedrooms !== undefined && prop.numberOfBedrooms !== null;
                const totalRooms = hasSplit
                  ? (prop.numberOfBedrooms || 0) + (prop.numberOfLivingRooms || 0)
                  : prop.numberOfRooms || 0;

                return (
                  <div
                    key={prop.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-4 hover:border-emerald-500 transition-colors shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{prop.name}</span>
                        {!hasSplit && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Legacy Total: {prop.numberOfRooms} Rooms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prop.addressLine1}, {prop.city}, {prop.state}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {hasSplit ? (
                          <>{prop.numberOfBedrooms || 0} Beds • {prop.numberOfLivingRooms || 0} Parlours • {prop.numberOfBathrooms} Baths • {prop.numberOfFloors} Floors</>
                        ) : (
                          <>{totalRooms} Rooms Total • {prop.numberOfBathrooms} Baths • {prop.numberOfFloors} Floors</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditForm(prop)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prop.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Property Name / Label"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home, Office, Beach House"
            />
            <Select
              label="Property Type"
              value={propertyTypeId}
              onChange={(e) => setPropertyTypeId(Number(e.target.value))}
              options={
                propertyTypes.length > 0
                  ? propertyTypes.map((pt) => ({ value: pt.id, label: pt.name }))
                  : [
                      { value: 1, label: 'Flat / Apartment' },
                      { value: 2, label: 'Duplex' },
                    ]
              }
            />
          </div>

          <Input
            label="Street Address Line 1"
            required
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
          />

          <Input
            label="Address Line 2 (Optional)"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="e.g. Suite 4B"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lagos"
            />
            <Input
              label="State"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Lagos State"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              label="Bedrooms"
              type="number"
              min="0"
              value={numberOfBedrooms}
              onChange={(e) => setNumberOfBedrooms(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <Input
              label="Living Rooms / Parlours"
              type="number"
              min="0"
              value={numberOfLivingRooms}
              onChange={(e) => setNumberOfLivingRooms(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <Input
              label="Bathrooms"
              type="number"
              min="1"
              value={numberOfBathrooms}
              onChange={(e) => setNumberOfBathrooms(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <Input
              label="Floors"
              type="number"
              min="1"
              value={numberOfFloors}
              onChange={(e) => setNumberOfFloors(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>

          {/* Optional Area Field with "I don't know" */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Area in square metres (optional)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontKnowArea}
                  onChange={(e) => setDontKnowArea(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>I don't know</span>
              </label>
            </div>

            {!dontKnowArea && (
              <Input
                type="number"
                min="10"
                value={squareMetersInput}
                onChange={(e) => setSquareMetersInput(e.target.value)}
                placeholder="e.g. 100"
              />
            )}
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Area does not affect this room-based price.</span>
            </p>
          </div>

          <Input
            label="Gate Access Instructions / Notes"
            value={accessInstructions}
            onChange={(e) => setAccessInstructions(e.target.value)}
            placeholder="e.g. Call estate gate code 4829 upon arrival"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {editingId ? 'Update Property' : 'Save Property'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
