import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../api/axios';
import { shortletCustomerApi } from '../../api/shortletCustomer';
import { cleaningCustomerApi } from '../../api/cleaningCustomer';
import { propertyListingsApi } from '../../api/propertyListings';

vi.mock('../../api/axios', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); });

it.each([
  [shortletCustomerApi.getCustomerBookings, '/bookings'],
  [cleaningCustomerApi.getCustomerBookings, '/cleaning/bookings'],
  [propertyListingsApi.getUserEnquiries, '/property-listings/my-enquiries'],
] as const)('loads customer history using the documented endpoint', async (load, endpoint) => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
  expect(await load()).toEqual([]);
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get).toHaveBeenCalledWith(endpoint);
});

it.each([shortletCustomerApi.getCustomerBookings, cleaningCustomerApi.getCustomerBookings])(
  'propagates booking failures without requesting admin or obsolete endpoints',
  async (load) => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(load()).rejects.toThrow('Unauthorized');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  },
);

it('submits only the enquiry message to the listing endpoint', async () => {
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { status: 'new' } });
  await propertyListingsApi.submitEnquiry(12, 'I am interested in inspecting this property.');
  expect(apiClient.post).toHaveBeenCalledWith('/property-listings/12/enquiries', {
    message: 'I am interested in inspecting this property.',
  });
});

it('requests a one-night quote and preserves the server breakdown', async () => {
  const payload = { startDate: '2026-10-22', endDate: '2026-10-23', guests: 2 };
  const response = { nights: 1, total: 140000, breakdown: { accommodationTotal: 100000, cleaningFee: 10000, cautionFee: 30000 } };
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: response });
  expect(await propertyListingsApi.getShortletQuote(12, payload)).toEqual(response);
  expect(apiClient.post).toHaveBeenCalledWith('/shortlets/listings/12/quote', payload);
});

it('saves a cleaning address through the customer endpoint', async () => {
  const address = { name: 'Home', propertyTypeId: 1, addressLine1: '12 Test Street', city: 'Lagos', state: 'Lagos', country: 'Nigeria', numberOfBathrooms: 1, numberOfFloors: 1 };
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { ...address, id: 1 } });
  await cleaningCustomerApi.createSavedProperty(address);
  expect(apiClient.post).toHaveBeenCalledWith('/cleaning/properties', address);
});
