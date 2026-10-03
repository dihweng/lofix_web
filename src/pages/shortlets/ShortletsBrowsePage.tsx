import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { propertyListingsApi, ListingPurpose, PropertyListing } from '../../api/propertyListings';
import { shortletCustomerApi } from '../../api/shortletCustomer';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EnquiryModal } from '../../components/listings/EnquiryModal';
import { formatNaira } from '../../utils/money';
import {
  Building2,
  Bed,
  Users,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Home,
  Tag,
} from 'lucide-react';

export const ShortletsBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [purposeTab, setPurposeTab] = useState<ListingPurpose>('SHORTLET');
  const [searchQuery, setSearchQuery] = useState('');
  const [minOccupancy, setMinOccupancy] = useState<string>('');

  const [enquiryListing, setEnquiryListing] = useState<PropertyListing | null>(null);

  // Fetch Property Listings for selected Purpose (sends purpose=shortlet, purpose=rent, purpose=sale)
  const { data: listings = [], isLoading: isListingsLoading } = useQuery({
    queryKey: ['propertyListings', purposeTab],
    queryFn: () => propertyListingsApi.getListings(purposeTab),
  });

  // Fetch Standalone Apartments (GET /apartments/search/search or /apartments) when SHORTLET tab active
  const { data: standaloneApartments = [], isLoading: isAptsLoading } = useQuery({
    queryKey: ['standaloneApartmentsSearch'],
    queryFn: shortletCustomerApi.getApartments,
    enabled: purposeTab === 'SHORTLET',
  });

  const isLoading = isListingsLoading || (purposeTab === 'SHORTLET' && isAptsLoading);

  // Convert standalone apartments to PropertyListing shape
  const mappedStandaloneListings: PropertyListing[] = (standaloneApartments || []).map((apt: any) => ({
    id: apt.id,
    source: "apartment",
    apartmentId: apt.id,
    title: apt.title || `Shortlet Apartment #${apt.id}`,
    description: apt.description || 'Verified luxury shortlet apartment',
    purpose: 'SHORTLET' as ListingPurpose,
    propertyType: apt.propertyType || 'Apartment',
    address: apt.address || `${apt.city || 'Lagos'}, ${apt.state || 'Nigeria'}`,
    price: apt.pricePerNight || apt.price || 0,
    pricePeriod: 'NIGHT',
    bedrooms: apt.bedrooms || apt.numberOfRooms || 1,
    bathrooms: apt.bathrooms || apt.numberOfBathrooms || 1,
    images: apt.imageUrls?.length ? apt.imageUrls : (apt.images?.map((image: any) => typeof image === 'string' ? image : image.url) || (apt.imageUrl ? [apt.imageUrl] : [])),
  }));

  // Combine listings for SHORTLET tab; only propertyListings for RENT and SALE
  const combinedListings: PropertyListing[] =
    purposeTab === 'SHORTLET'
      ? [...listings, ...mappedStandaloneListings.filter((a) => !listings.some((l) => l.apartmentId === a.apartmentId))]
      : listings;

  const filteredListings = combinedListings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOccupancy =
      !minOccupancy || (listing.bedrooms || 1) >= parseInt(minOccupancy, 10);

    return matchesSearch && matchesOccupancy;
  });

  const getPlaceholderImage = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ];
    return images[index % images.length];
  };

  return (
    <CustomerLayout>
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Real Estate Advertisements & Shortlets</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              {purposeTab === 'SHORTLET'
                ? 'Book Premium Shortlet Stays'
                : purposeTab === 'RENT'
                ? 'Properties Available for Rent'
                : 'Exclusive Properties for Sale'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore verified real estate listings with transparent pricing, full specification breakdowns, and instant booking or agent contact actions.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPurposeTab('SHORTLET')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeTab === 'SHORTLET'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bed className="w-4 h-4" />
                <span>Shortlet Stays</span>
              </button>

              <button
                onClick={() => setPurposeTab('RENT')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeTab === 'RENT'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>For Rent</span>
              </button>

              <button
                onClick={() => setPurposeTab('SALE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  purposeTab === 'SALE'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>For Sale</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Listings & Direct Agent Contact</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by title, address, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select
              value={minOccupancy}
              onChange={(e) => setMinOccupancy(e.target.value)}
              options={[
                { value: '', label: 'Any Bedrooms' },
                { value: '1', label: '1+ Bedrooms' },
                { value: '2', label: '2+ Bedrooms' },
                { value: '3', label: '3+ Bedrooms' },
                { value: '4', label: '4+ Bedrooms' },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Property Listings Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, idx) => {
              const formattedPrice = formatNaira(listing.price);
              const periodText = listing.pricePeriod ? `/ ${listing.pricePeriod}` : '';
              const isShortletListing = String(listing.purpose || '').toUpperCase() === 'SHORTLET';

              return (
                <Card
                  key={`${listing.source || "listing"}-${listing.purpose}-${listing.id}`}
                  className="group overflow-hidden border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={listing.images?.length ? listing.images[0] : getPlaceholderImage(idx)}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="primary" size="sm">
                          {listing.purpose}
                        </Badge>
                        <Badge variant="info" size="sm">
                          {listing.propertyType}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold">
                        {formattedPrice} <span className="font-normal text-[10px]">{periodText}</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{listing.address}</span>
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
                        {listing.bedrooms !== undefined && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-emerald-600" />
                            {listing.bedrooms} Beds
                          </span>
                        )}
                        {listing.bathrooms !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            {listing.bathrooms} Baths
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {isShortletListing ? (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full font-bold"
                        onClick={() => navigate(listing.source === "apartment" ? `/shortlets/apartment/${listing.id}` : `/listings/${listing.id}`)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Book & Pay Instantly
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full font-bold"
                        onClick={() => setEnquiryListing(listing)}
                        leftIcon={<PhoneCall className="w-4 h-4 text-emerald-400" />}
                      >
                        Contact Agent / Enquire
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <EnquiryModal
        isOpen={!!enquiryListing}
        listing={enquiryListing}
        onClose={() => setEnquiryListing(null)}
        onSuccess={() => {}}
      />
    </CustomerLayout>
  );
};
