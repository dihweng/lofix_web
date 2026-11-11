import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { authApi } from '../../api/auth';
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
  afterEach(() => { vi.restoreAllMocks(); });
  it.each([true, false])('routes unverified login to email verification (delivery succeeds: %s)', async (delivered) => {
    mockLogin.mockRejectedValueOnce({ response: { data: { message: 'Email verification is required' } } });
    const send = vi.spyOn(authApi, 'resendEmailVerification');
    if (delivered) send.mockResolvedValue({ message: 'Sent' });
    else send.mockRejectedValue({ response: { data: { message: 'Delivery unavailable' } } });
    const LocationProbe = () => { const location = useLocation(); return <output data-testid="verification-route">{JSON.stringify(location)}</output>; };
    render(<MemoryRouter><LocationProbe /><AuthModals isOpen mode="login" onClose={() => {}} onSwitchMode={() => {}} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'private-password' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByTestId('verification-route')).toHaveTextContent('/account/verify-email'));
    expect(send).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'private-password' });
    const route = JSON.parse(screen.getByTestId('verification-route').textContent || '{}');
    expect(route.state.email).toBe('jane@example.com');
    expect(JSON.stringify(route.state)).not.toContain('private-password');
    if (delivered) expect(route.state.deliveryMessage).toMatch(/code has been sent/);
    else expect(route.state.deliveryError).toBe('Delivery unavailable');
  });
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
      message: 'Registration successful, please check your email for verification instructions',
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
        registrationMessage: 'Registration successful, please check your email for verification instructions',
      },
    });
  });

  it('shows validation errors returned by the registration API', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: 'Email address already registered' } },
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
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create customer account/i }));

    expect(await screen.findByText('Email address already registered')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

});


it.each(['login', 'register'] as const)('shows readable policy links in %s without losing form state', mode => {
  render(<BrowserRouter><AuthModals isOpen mode={mode} onClose={() => {}} onSwitchMode={() => {}} /></BrowserRouter>);
  for (const [name, href] of [['Terms and Conditions', '/terms'], ['Privacy Policy', '/privacy']]) {
    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  if (mode === 'register') {
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('checkbox')).toBeRequired();
  } else expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});
