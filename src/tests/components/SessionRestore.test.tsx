import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { saveSession } from '../../context/session';

vi.mock('../../api/auth', () => ({ authApi: { refreshToken: vi.fn(), revokeToken: vi.fn() } }));
const account = { id: 1, firstName: 'Ada', lastName: 'Test', email: 'ada@example.com', role: 'User' as const };
const jwt = (exp: number) => `header.${btoa(JSON.stringify({ exp }))}.signature`;
function Status() {
  const { user, isLoading } = useAuth();
  return <div>{isLoading ? 'Loading' : user?.firstName || 'Guest'}</div>;
}
const mount = () => render(<React.StrictMode><AuthProvider><Status /></AuthProvider></React.StrictMode>);
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);

describe('session restoration', () => {
  it('restores a valid saved session without depending on a refresh cookie', async () => {
    const token = jwt(Date.now() / 1000 + 3600);
    localStorage.setItem('lofix_customer_jwt', token);
    saveSession('lofix_customer_jwt', token, account);
    mount();
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(authApi.refreshToken).not.toHaveBeenCalled();
  });
  it('refreshes an expired session and persists the replacement', async () => {
    const expired = jwt(1);
    const fresh = jwt(Date.now() / 1000 + 3600);
    localStorage.setItem('lofix_customer_jwt', expired);
    saveSession('lofix_customer_jwt', expired, account);
    vi.mocked(authApi.refreshToken).mockResolvedValue({ ...account, jwtToken: fresh });
    mount();
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(localStorage.getItem('lofix_customer_jwt')).toBe(fresh);
  });
  it('clears a rejected session', async () => {
    localStorage.setItem('lofix_customer_jwt', jwt(1));
    vi.mocked(authApi.refreshToken).mockRejectedValue({ response: { status: 401 } });
    mount();
    await waitFor(() => expect(screen.getByText('Guest')).toBeInTheDocument());
    expect(localStorage.getItem('lofix_customer_jwt')).toBeNull();
  });
});
