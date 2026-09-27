import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthModals } from '../../components/auth/AuthModals';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    jwtToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('Customer Auth Component', () => {
  it('renders login form with email and password fields', () => {
    render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="login" onClose={() => {}} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('submits credentials on valid form fill', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="login" onClose={() => {}} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'customer@lofix.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'customer@lofix.com',
        password: 'secret123',
      });
    });
  });
});
