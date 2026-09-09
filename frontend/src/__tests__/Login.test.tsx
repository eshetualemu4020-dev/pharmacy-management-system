import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import Login from '../pages/Login';
import { authApi } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    // Mock the API to never resolve so we can see loading state
    (authApi.login as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  it('displays error message on failed login', async () => {
    (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    
    renderWithProviders(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
