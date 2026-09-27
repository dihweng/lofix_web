import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthModals } from '../../components/auth/AuthModals';
import { BrowserRouter } from 'react-router-dom';

const mockRegister = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    jwtToken: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

describe('Customer Registration Component', () => {
  it('renders registration form fields', () => {
    render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="register" onClose={() => {}} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create customer account/i })).toBeInTheDocument();
  });
});
