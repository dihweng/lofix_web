import { render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyGuestDetails } from '../../components/listings/PropertyGuestDetails';
vi.mock('../../api/axios', () => ({ apiClient: { get: vi.fn().mockResolvedValue({ data: { details: { bathrooms: 2, furnishingStatus: 'furnished' }, amenities: [{ name: 'Pool' }] } }) } }));
it('shows only saved amenities and actual extended details', async () => {
 render(<QueryClientProvider client={new QueryClient()}><PropertyGuestDetails apartmentId={1} property={{ hasInternet: true, hasTv: false }} /></QueryClientProvider>);
 expect(await screen.findByText('Pool')).toBeInTheDocument();
 expect(screen.getByText('Internet')).toBeInTheDocument();
 expect(screen.getByText('Bathrooms')).toBeInTheDocument();
 expect(screen.queryByText('TV')).not.toBeInTheDocument();
 expect(screen.queryByText('24/7 Uninterrupted Power')).not.toBeInTheDocument();
});
