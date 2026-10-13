import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';
import { Zap, Wind, Tv, Utensils, Droplet, ShieldCheck, Wifi, Waves, Dumbbell, Sparkles } from 'lucide-react';

const flags: Record<string, string> = { hasTv: 'TV', hasKitchen: 'Kitchen', hasAirCon: 'Air conditioning', hasHeating: 'Heating', hasInternet: 'Internet', hasWater: 'Water', hasLight: 'Electricity' };
const labels: Record<string, string> = { bathrooms: 'Bathrooms', toilets: 'Toilets', floors: 'Floors', parkingSpaces: 'Parking spaces', furnishingStatus: 'Furnishing', city: 'City', state: 'State', country: 'Country', area: 'Area', yearBuilt: 'Year built', isServiced: 'Serviced', isNewlyBuilt: 'Newly built' };

const getAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('power') || lower.includes('light') || lower.includes('electricity')) {
    return <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  }
  if (lower.includes('ac') || lower.includes('air') || lower.includes('condition')) {
    return <Wind className="w-4 h-4 text-sky-500 flex-shrink-0" />;
  }
  if (lower.includes('tv') || lower.includes('dstv') || lower.includes('television')) {
    return <Tv className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  }
  if (lower.includes('kitchen') || lower.includes('cooking') || lower.includes('utensils')) {
    return <Utensils className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  }
  if (lower.includes('water') || lower.includes('borehole')) {
    return <Droplet className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  }
  if (lower.includes('security') || lower.includes('guard') || lower.includes('gate') || lower.includes('safe')) {
    return <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
  }
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('net')) {
    return <Wifi className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
  }
  if (lower.includes('pool') || lower.includes('swim')) {
    return <Waves className="w-4 h-4 text-cyan-500 flex-shrink-0" />;
  }
  if (lower.includes('gym') || lower.includes('fitness')) {
    return <Dumbbell className="w-4 h-4 text-purple-500 flex-shrink-0" />;
  }
  return <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
};

export const PropertyGuestDetails: React.FC<{ apartmentId?: number; property?: object }> = ({ apartmentId, property }) => {
  const { data, isError, refetch } = useQuery({
    queryKey: ['guest-property-details', apartmentId],
    queryFn: async () => (await apiClient.get(`/property-catalog/apartments/${apartmentId}/details`)).data,
    enabled: !!apartmentId,
    retry: false,
  });
  const values = (property || {}) as Record<string, unknown>;
  const amenities = [...new Set<string>([...Object.entries(flags).filter(([key]) => values[key] === true).map(([, name]) => name), ...(data?.amenities || []).map((a: { name: string }) => a.name)])];
  const details = data?.details || {};

  return (
    <section className="space-y-3 border-t border-slate-100 pt-4 text-xs">
      <h3 className="font-bold text-slate-900 text-sm">Amenities & property details</h3>
      {amenities.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {amenities.map(name => (
            <div key={name} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 font-semibold text-slate-800 shadow-2xs">
              {getAmenityIcon(name)}
              <span>{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No amenities specified.</p>
      )}
      {isError && (
        <p className="text-red-600">
          Additional details could not be loaded.{' '}
          <button type="button" onClick={() => refetch()} className="underline font-bold">
            Retry
          </button>
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs pt-2">
        {values.totalBedrooms != null && <div><dt className="text-slate-500">Bedrooms</dt><dd className="font-bold text-slate-900">{String(values.totalBedrooms)}</dd></div>}
        {values.totalOccupancy != null && <div><dt className="text-slate-500">Maximum guests</dt><dd className="font-bold text-slate-900">{String(values.totalOccupancy)}</dd></div>}
        {Object.entries(labels).filter(([key]) => details[key] != null && details[key] !== '').map(([key, label]) => <div key={key}><dt className="text-slate-500">{label}</dt><dd className="font-bold text-slate-900">{typeof details[key] === 'boolean' ? (details[key] ? 'Yes' : 'No') : String(details[key]).replace(/_/g, ' ')}</dd></div>)}
        {details.size != null && <div><dt className="text-slate-500">Property size</dt><dd className="font-bold text-slate-900">{details.size} {details.sizeUnit}</dd></div>}
        {values.isPartyAllowed != null && <div><dt className="text-slate-500">Parties allowed</dt><dd className="font-bold text-slate-900">{values.isPartyAllowed ? 'Yes' : 'No'}</dd></div>}
      </dl>
    </section>
  );
};
