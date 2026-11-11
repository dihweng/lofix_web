import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { faqsApi } from '../../api/faqs';
import { FaqPage } from '../../pages/FaqPage';

vi.mock('../../components/layout/CustomerLayout', () => ({ CustomerLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
afterEach(() => { vi.restoreAllMocks(); });

it('loads, filters and expands backend-managed FAQs', async () => {
  vi.spyOn(faqsApi, 'list').mockResolvedValue([
    { id: 1, slug: 'supplies', version: 1, title: 'Do I provide supplies?', body: 'Choose supplies included or customer-provided.', details: { category: 'Cleaning', sortOrder: 10 } },
    { id: 2, slug: 'token', version: 1, title: 'Where is my token?', body: 'Check the existing utility order.', details: { category: 'Utilities', sortOrder: 20 } },
  ]);
  render(<FaqPage />);
  expect(await screen.findByRole('button', { name: 'Do I provide supplies?' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Do I provide supplies?' }));
  expect(screen.getByText(/choose supplies included/i)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/search for a question/i), { target: { value: 'token' } });
  expect(screen.queryByRole('button', { name: 'Do I provide supplies?' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Where is my token?' })).toBeInTheDocument();
});
