import { Account } from '../api/auth';

// Cached account details restore the UI only; the API still validates every JWT.
export function readSession(tokenKey: string): Account | null {
  const token = localStorage.getItem(tokenKey);
  const cached = localStorage.getItem(`${tokenKey}_account`);
  if (!token || !cached) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const session = JSON.parse(cached);
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 30_000) return null;
    return session.token === token ? session.account : null;
  } catch {
    return null;
  }
}

export function saveSession(tokenKey: string, token: string | null, account: Account | null) {
  if (token && account) {
    localStorage.setItem(`${tokenKey}_account`, JSON.stringify({ token, account }));
  } else {
    localStorage.removeItem(`${tokenKey}_account`);
  }
}
