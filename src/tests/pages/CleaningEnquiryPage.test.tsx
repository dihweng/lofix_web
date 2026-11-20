import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CleaningEnquiryPage } from '../../pages/cleaning/CleaningEnquiryPage';
import { cleaningIntakeApi } from '../../api/cleaningIntake';
const auth = vi.hoisted(() => ({ isAuthenticated: true, user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phoneNumber: '08012345678' } }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../components/layout/CustomerLayout', () => ({ CustomerLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../../components/auth/AuthModals', () => ({ AuthModals: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Sign-in dialog</div> : null }));
vi.mock('../../api/cleaningIntake', () => ({ cleaningIntakeApi: { apply: vi.fn(), request: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); auth.isAuthenticated = true; });
afterEach(cleanup);
function mount(kind: string) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/cleaning/enquiry/' + kind]}><Routes><Route path="/cleaning/enquiry/:kind" element={<CleaningEnquiryPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
function fillCommon() {
  fireEvent.change(screen.getByLabelText('City / area'), { target: { value: 'Lekki, Lagos' } });
  fireEvent.click(screen.getByRole('checkbox'));
}
it('submits an agent application and shows the persisted tracking reference', async () => {
  vi.mocked(cleaningIntakeApi.apply).mockResolvedValue({ message: 'Received', ticket: { id: 12 } });
  mount('cleaner'); fillCommon();
  fireEvent.change(screen.getByLabelText('Skills, experience and preferred work areas'), { target: { value: 'Five years of home cleaning experience.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
  await waitFor(() => expect(cleaningIntakeApi.apply).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Jane Doe', consent: true, availability: 'PART_TIME', experience: 'NEW' })));
  expect(await screen.findByRole('status')).toHaveTextContent('#12');
  expect(screen.getByRole('link', { name: 'Track this application' })).toHaveAttribute('href', '/contact?message=12');
});
it('sends commercial scope and optional document link, retaining the draft on failure', async () => {
  vi.mocked(cleaningIntakeApi.request).mockRejectedValue(new Error('offline'));
  mount('commercial'); fillCommon();
  for (const [label, value] of [['Property size', '800 square metres'], ['Preferred schedule / frequency', 'Weekdays'], ['Organisation', 'Acme'], ['Requirements, site address and any access instructions', 'Office cleaning required every weekday.'], ['Scope or tender document link (optional)', 'https://example.com/tender']]) {
    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('entries are still here');
  expect(cleaningIntakeApi.request).toHaveBeenCalledWith(expect.objectContaining({ kind: 'commercial', organisation: 'Acme', documentUrl: 'https://example.com/tender' }));
  expect(screen.getByLabelText('Organisation')).toHaveValue('Acme');
});
it('requires login without calling an intake endpoint', () => {
  auth.isAuthenticated = false; mount('cleaner');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in / create account' }));
  expect(screen.getByText('Sign-in dialog')).toBeInTheDocument();
  expect(cleaningIntakeApi.apply).not.toHaveBeenCalled();
});
it('keeps the enquiry button disabled while sending to avoid duplicate clicks', async () => {
  vi.mocked(cleaningIntakeApi.apply).mockImplementation(() => new Promise(() => {}));
  mount('cleaner'); fillCommon();
  fireEvent.change(screen.getByLabelText('Skills, experience and preferred work areas'), { target: { value: 'Experienced house cleaner.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit application' })).toBeDisabled());
  expect(cleaningIntakeApi.apply).toHaveBeenCalledTimes(1);
});

it('submits home requirements without commercial or agent fields', async () => {
  vi.mocked(cleaningIntakeApi.request).mockResolvedValue({ message: 'Received', ticket: { id: 15 } });
  mount('home'); fillCommon();
  fireEvent.change(screen.getByLabelText('Property size'), { target: { value: '2 bedrooms' } });
  fireEvent.change(screen.getByLabelText('Preferred schedule / frequency'), { target: { value: 'Weekly mornings' } });
  fireEvent.change(screen.getByLabelText('Requirements, site address and any access instructions'), { target: { value: 'Please arrange a regular cleaner.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
  expect(await screen.findByRole('status')).toHaveTextContent('#15');
  const payload = vi.mocked(cleaningIntakeApi.request).mock.calls[0][0];
  expect(payload.kind).toBe('home');
  expect(payload).not.toHaveProperty('organisation');
  expect(payload).not.toHaveProperty('experience');
});
