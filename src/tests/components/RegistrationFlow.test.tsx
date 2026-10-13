import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { AuthModals } from '../../components/auth/AuthModals';
import { apiClient, configureAxiosAuth } from '../../api/axios';
const adapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = adapter; configureAxiosAuth(() => null, () => {}, () => {}); localStorage.clear(); vi.restoreAllMocks(); });

it('requires explicit consent and keeps a registration 400 visible without fallback, login or refresh', async () => {
  localStorage.clear();
  const refresh = vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 401 } });
  const paths: string[] = [];
  apiClient.defaults.adapter = async config => {
    paths.push(config.url || '');
    throw { config, response: { status: 400, data: { message: 'Original registration validation error' } } };
  };
  const close = vi.fn();
  const { container } = render(<MemoryRouter><AuthProvider><AuthModals isOpen mode="register" onClose={close} onSwitchMode={() => {}} /></AuthProvider></MemoryRouter>);
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  // Let startup finish before distinguishing it from registration-triggered refresh.
  await new Promise(resolve => setTimeout(resolve, 0));
  refresh.mockClear();
  for (const [label, value] of [[/first name/i, 'Jane'], [/last name/i, 'Doe'], [/email address/i, 'jane@example.com'], [/phone number/i, '08012345678'], [/^password/i, 'pass1234'], [/confirm password/i, 'pass1234']] as const) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByText(/please accept the terms/i)).toBeInTheDocument();
  expect(paths).toEqual([]);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(container.querySelector('form')!);
  expect(await screen.findByText('Original registration validation error')).toBeInTheDocument();
  expect(paths).toEqual(['/accounts/register']);
  expect(refresh).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /create customer account/i })).toBeInTheDocument();
});
