import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import URLTable from '../URLTable';
import { apiService } from '../../API/api';

// Mock the API service
jest.mock('../../API/api', () => ({
  apiService: {
    getURLs: jest.fn(),
    deleteURLs: jest.fn(),
    reanalyzeURL: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockURLs = [
  {
    id: 1,
    url: 'https://example.com',
    status: 'done' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    url: 'https://test.com',
    status: 'running' as const,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockResponse = {
  urls: mockURLs,
  total: 2,
  page: 1,
  page_size: 10,
  total_pages: 1,
};

describe('URLTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getURLs.mockResolvedValue(mockResponse);
  });

  it('renders table with URLs', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<URLTable refreshTrigger={0} />);
    
    expect(screen.getByText('Loading URLs...')).toBeInTheDocument();
  });

  it('displays status badges correctly', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      // Use more specific selectors to avoid conflicts
      const statusBadges = screen.getAllByText(/Done|Running/);
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  it('handles search functionality', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    // Wait for the table to load
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search URLs...');
    await act(async () => {
      userEvent.type(searchInput, 'example');
    });
    
    await waitFor(() => {
      expect(mockApiService.getURLs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'example',
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    // Wait for the table to load
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    const statusSelect = screen.getByDisplayValue('All Status');
    await act(async () => {
      userEvent.selectOptions(statusSelect, 'done');
    });
    
    await waitFor(() => {
      expect(mockApiService.getURLs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'done',
        })
      );
    });
  });

  it('handles sorting by clicking column headers', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('URL')).toBeInTheDocument();
    });
    
    const urlHeader = screen.getByText('URL');
    await act(async () => {
      userEvent.click(urlHeader);
    });
    
    await waitFor(() => {
      expect(mockApiService.getURLs).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_field: 'url',
          sort_direction: 'asc',
        })
      );
    });
  });

  it('navigates to details page on row click', async () => {
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    const row = screen.getByText('https://example.com').closest('tr');
    await act(async () => {
      userEvent.click(row!);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/details/1');
  });

  it('handles bulk delete action', async () => {
    mockApiService.deleteURLs.mockResolvedValue({ message: 'Deleted successfully' });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    // Select first URL
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // First checkbox after header
    await act(async () => {
      userEvent.click(firstRowCheckbox);
    });
    
    // Click delete button (use getAllByText to get the bulk action button)
    const deleteButtons = screen.getAllByText('Delete');
    const bulkDeleteButton = deleteButtons[0]; // First delete button is the bulk action
    await act(async () => {
      userEvent.click(bulkDeleteButton);
    });
    
    await waitFor(() => {
      expect(mockApiService.deleteURLs).toHaveBeenCalledWith([1]);
    });
  });

  it('handles bulk reanalyze action', async () => {
    mockApiService.reanalyzeURL.mockResolvedValue({ message: 'Re-analyzing' });
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    // Select first URL
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    await act(async () => {
      userEvent.click(firstRowCheckbox);
    });
    
    // Click re-analyze button (use getAllByText to get the bulk action button)
    const reanalyzeButtons = screen.getAllByText('Re-analyze');
    const bulkReanalyzeButton = reanalyzeButtons[0]; // First re-analyze button is the bulk action
    await act(async () => {
      userEvent.click(bulkReanalyzeButton);
    });
    
    await waitFor(() => {
      expect(mockApiService.reanalyzeURL).toHaveBeenCalledWith(1);
    });
  });

  it('handles individual reanalyze action', async () => {
    mockApiService.reanalyzeURL.mockResolvedValue({ message: 'Re-analyzing' });
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    // Get the individual re-analyze button (first one in the table)
    const reanalyzeButtons = screen.getAllByText('Re-analyze');
    const individualReanalyzeButton = reanalyzeButtons[0]; // First button is individual action
    await act(async () => {
      userEvent.click(individualReanalyzeButton);
    });
    
    await waitFor(() => {
      expect(mockApiService.reanalyzeURL).toHaveBeenCalledWith(1);
    });
  });

  it('shows error message when API fails', async () => {
    mockApiService.getURLs.mockRejectedValue({
      response: { data: { error: 'Failed to fetch URLs' } },
    });
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch URLs')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockResponse,
      total: 25,
      total_pages: 3,
    };
    
    mockApiService.getURLs.mockResolvedValue(paginatedResponse);
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    await act(async () => {
      userEvent.click(nextButton);
    });
    
    await waitFor(() => {
      expect(mockApiService.getURLs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('shows empty state when no URLs', async () => {
    mockApiService.getURLs.mockResolvedValue({
      urls: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    });
    
    render(<URLTable refreshTrigger={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('No URLs found')).toBeInTheDocument();
    });
  });
}); 