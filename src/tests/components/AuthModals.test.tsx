import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthModals } from '../../components/auth/AuthModals';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
    jwtToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('AuthModals component', () => {
  it('renders customer login modal with email and password fields', () => {
    render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="login" onClose={() => {}} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('shows error if submitted with empty fields', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="login" onClose={() => {}} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    const form = container.querySelector('form');
    if (form) {
      form.noValidate = true;
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
    });
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
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'customer@lofix.com',
        password: 'password123',
      });
    });
  });
});
