import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AuthModals } from '../../components/auth/AuthModals';
import { BrowserRouter, MemoryRouter, useLocation } from 'react-router-dom';

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
  beforeEach(() => {
    mockLogin.mockReset();
    mockRegister.mockReset();
  });

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

  it('shows an error when submitted with empty login fields', async () => {
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

    expect(await screen.findByText(/please enter both email and password/i)).toBeInTheDocument();
  });

  it('submits valid login credentials', async () => {
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

  it('registers a customer with the required public payload and waits for verification', async () => {
    mockRegister.mockResolvedValueOnce({
      message: 'Registration successful, please check your phone or email for verification instructions',
    });
    const onClose = vi.fn();
    const LocationProbe = () => {
      const location = useLocation();
      return <output data-testid="location">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
    };

    render(
      <MemoryRouter>
        <LocationProbe />
        <AuthModals isOpen={true} mode="register" onClose={onClose} onSwitchMode={() => {}} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '08012345678' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create customer account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        title: 'Mr',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phoneNumber: '08012345678',
        password: 'pass1234',
        confirmPassword: 'pass1234',
        acceptTerms: true,
      });
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(JSON.parse(screen.getByTestId('location').textContent || '{}')).toEqual({
      pathname: '/account/verify-email',
      state: {
        email: 'jane@example.com',
        phoneNumber: '08012345678',
        registrationMessage: 'Registration successful, please check your phone or email for verification instructions',
      },
    });
  });

  it('shows validation errors returned by the registration API', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Phone number already registered' } },
    });

    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <AuthModals isOpen={true} mode="register" onClose={onClose} onSwitchMode={() => {}} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '08012345678' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create customer account/i }));

    expect(await screen.findByText('Phone number already registered')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

});
