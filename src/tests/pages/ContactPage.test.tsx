import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactPage } from '../../pages/ContactPage';
import { supportApi } from '../../api/support';

vi.mock('../../components/layout/CustomerLayout', () => ({ CustomerLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: 4, email: 'jane@example.com' } }) }));
beforeEach(() => { vi.spyOn(supportApi, 'getMessages').mockResolvedValue({ items: [], total: 0 }); });
afterEach(() => { vi.restoreAllMocks(); });
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><ContactPage /></MemoryRouter></QueryClientProvider>);

it('offers contact channels and submits a message without leaving the app', async () => {
  const send = vi.spyOn(supportApi, 'sendMessage').mockResolvedValue({ message: 'Message sent to support.' });
  mount();
  expect(screen.getByRole('link', { name: /WhatsApp/i })).toHaveAttribute('href', 'https://wa.me/2349099474330');
  expect(screen.getByRole('link', { name: /Call us/i })).toHaveAttribute('href', 'tel:+2349099474330');
  fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Booking question' } });
  fireEvent.change(screen.getByLabelText(/your message/i), { target: { value: 'Please help with my cleaning booking.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Message sent to support.');
  expect(send).toHaveBeenCalledWith({ subject: 'Booking question', message: 'Please help with my cleaning booking.' });
  expect(screen.getByLabelText(/your message/i)).toHaveValue('');
});

it('preserves the message when delivery fails', async () => {
  vi.spyOn(supportApi, 'sendMessage').mockRejectedValue({ response: { data: { message: 'Delivery unavailable' } } });
  mount();
  fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Help' } });
  fireEvent.change(screen.getByLabelText(/your message/i), { target: { value: 'My message' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Delivery unavailable'));
  expect(screen.getByLabelText(/your message/i)).toHaveValue('My message');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
