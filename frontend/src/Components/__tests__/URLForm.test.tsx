import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import URLForm from '../URLForm';
import { apiService } from '../../API/api';

// Mock the API service
jest.mock('../../API/api', () => ({
  apiService: {
    createURL: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('URLForm', () => {
  const mockOnURLAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with input and submit button', () => {
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add url/i })).toBeInTheDocument();
  });

  it('validates URL format before submission', async () => {
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByRole('button', { name: /add url/i });

    // Test empty URL first
    await act(async () => {
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
    expect(mockApiService.createURL).not.toHaveBeenCalled();
  });

  it('submits valid URL successfully', async () => {
    const mockResponse = {
      id: 1,
      url: 'https://example.com',
      status: 'queued' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockApiService.createURL.mockResolvedValue(mockResponse);
    
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByRole('button', { name: /add url/i });

    await act(async () => {
      userEvent.type(input, 'https://example.com');
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockApiService.createURL).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });

    expect(mockOnURLAdded).toHaveBeenCalled();
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiService.createURL.mockRejectedValue({
      response: { data: { error: 'URL already exists' } },
    });
    
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByRole('button', { name: /add url/i });

    await act(async () => {
      userEvent.type(input, 'https://example.com');
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/url already exists/i)).toBeInTheDocument();
    });

    expect(mockOnURLAdded).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApiService.createURL.mockReturnValue(promise);
    
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByRole('button', { name: /add url/i });

    await act(async () => {
      userEvent.type(input, 'https://example.com');
      userEvent.click(submitButton);
    });

    expect(screen.getByText(/adding/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await act(async () => {
      resolvePromise!({
        id: 1,
        url: 'https://example.com',
        status: 'queued',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(/adding/i)).not.toBeInTheDocument();
    });
  });

  it('accepts URLs with and without protocol', async () => {
    mockApiService.createURL.mockResolvedValue({
      id: 1,
      url: 'https://example.com',
      status: 'queued' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
    
    render(<URLForm onURLAdded={mockOnURLAdded} />);
    
    const input = screen.getByPlaceholderText('https://example.com');
    const submitButton = screen.getByRole('button', { name: /add url/i });

    // Test with protocol
    await act(async () => {
      userEvent.clear(input);
      userEvent.type(input, 'https://example.com');
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockApiService.createURL).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });

    // Test without protocol (should add https://)
    jest.clearAllMocks();
    await act(async () => {
      userEvent.clear(input);
      userEvent.type(input, 'example.com');
      userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockApiService.createURL).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });
  });
}); 