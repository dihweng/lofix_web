import { expect, it, vi } from 'vitest';
import { apiClient } from '../../api/axios';
import { shortletCustomerApi } from '../../api/shortletCustomer';
vi.mock('../../api/axios', () => ({ apiClient: { get: vi.fn() } }));
it('customer detail uses the active listed apartment endpoint', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 13 } });
  await shortletCustomerApi.getApartmentById(13);
  expect(apiClient.get).toHaveBeenCalledWith('/apartments/search/search/13');
});
it('customer search failure never falls back to the admin route', async () => {
  vi.mocked(apiClient.get).mockClear().mockRejectedValueOnce(new Error('unauthorized'));
  await expect(shortletCustomerApi.getApartments()).rejects.toThrow('unauthorized');
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get).toHaveBeenCalledWith('/apartments/search/search');
});
