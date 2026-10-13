import axios from 'axios';
import { expect, it, vi } from 'vitest';
import { refreshSession } from '../../api/axios';

it('shares one refresh request between simultaneous callers', async () => {
  const data = { jwtToken: 'replacement' };
  const post = vi.spyOn(axios, 'post').mockResolvedValue({ data });
  try {
    const first = refreshSession();
    const second = refreshSession();
    expect(first).toBe(second);
    await expect(first).resolves.toEqual(data);
    expect(post).toHaveBeenCalledTimes(1);
    await refreshSession();
    expect(post).toHaveBeenCalledTimes(2);
  } finally {
    post.mockRestore();
  }
});
