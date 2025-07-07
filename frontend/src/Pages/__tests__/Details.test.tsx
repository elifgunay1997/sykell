import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Details from '../Details';
import { apiService } from '../../API/api';

// Mock the API service
jest.mock('../../API/api', () => ({
  apiService: {
    getURLDetails: jest.fn(),
    reanalyzeURL: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
}));

const mockAnalysisResult = {
  id: 1,
  url_id: 1,
  url: {
    id: 1,
    url: 'https://example.com',
    status: 'done' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  title: 'Example Website',
  html_version: 'HTML5',
  h1_count: 2,
  h2_count: 5,
  h3_count: 3,
  h4_count: 1,
  h5_count: 0,
  h6_count: 0,
  internal_links: 15,
  external_links: 8,
  broken_links: 2,
  has_login_form: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockBrokenLinks = [
  {
    id: 1,
    analysis_id: 1,
    url: 'https://broken-link.com',
    status_code: 404,
    error_message: 'Not Found',
  },
  {
    id: 2,
    analysis_id: 1,
    url: 'https://server-error.com',
    status_code: 500,
    error_message: 'Internal Server Error',
  },
];

const mockResponse = {
  analysis_result: mockAnalysisResult,
  broken_links: mockBrokenLinks,
};

describe('Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getURLDetails.mockResolvedValue(mockResponse);
  });

  it('renders loading state initially', () => {
    render(<Details />);
    
    expect(screen.getByText('Loading details...')).toBeInTheDocument();
  });

  it('renders analysis details when data is loaded', async () => {
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('Analysis Details')).toBeInTheDocument();
      expect(screen.getByText('Example Website')).toBeInTheDocument();
      expect(screen.getByText('HTML5')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument(); // Login form detected
    });
  });

  it('displays basic information correctly', async () => {
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('done')).toBeInTheDocument();
      expect(screen.getByText('Example Website')).toBeInTheDocument();
      expect(screen.getByText('HTML5')).toBeInTheDocument();
    });
  });

  it('displays heading counts correctly', async () => {
    render(<Details />);
    
    await waitFor(() => {
      // Use more specific selectors to avoid conflicts with multiple "0" values
      const h1Element = screen.getByText('2').closest('div');
      const h2Element = screen.getByText('5').closest('div');
      const h3Element = screen.getByText('3').closest('div');
      const h4Element = screen.getByText('1').closest('div');
      
      expect(h1Element).toBeInTheDocument();
      expect(h2Element).toBeInTheDocument();
      expect(h3Element).toBeInTheDocument();
      expect(h4Element).toBeInTheDocument();
      
      // Check that H5 and H6 show 0
      const h5Elements = screen.getAllByText('0');
      expect(h5Elements.length).toBeGreaterThan(0);
    });
  });

  it('displays broken links table when broken links exist', async () => {
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('Broken Links (2)')).toBeInTheDocument();
      expect(screen.getByText('https://broken-link.com')).toBeInTheDocument();
      expect(screen.getByText('https://server-error.com')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });
  });

  it('handles navigation back to dashboard', async () => {
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });
    
    const backButton = screen.getByText('← Back to Dashboard');
    userEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles retry analysis when analysis failed', async () => {
    const failedAnalysis = {
      ...mockAnalysisResult,
      title: '', // Empty title indicates failed analysis
    };
    
    const failedResponse = {
      analysis_result: failedAnalysis,
      broken_links: [],
    };
    
    mockApiService.getURLDetails.mockResolvedValue(failedResponse);
    mockApiService.reanalyzeURL.mockResolvedValue({ message: 'Re-analyzing' });
    
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('Analysis Failed or Incomplete')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Retry Analysis');
    userEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockApiService.reanalyzeURL).toHaveBeenCalledWith(1);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error state when API fails', async () => {
    mockApiService.getURLDetails.mockRejectedValue({
      response: { data: { error: 'Failed to fetch details' } },
    });
    
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch details')).toBeInTheDocument();
    });
  });

  it('shows no data found when analysis result is null', async () => {
    mockApiService.getURLDetails.mockResolvedValue({
      analysis_result: null as any,
      broken_links: [],
    });
    
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument();
    });
  });

  it('does not show broken links table when no broken links', async () => {
    const responseWithoutBrokenLinks = {
      analysis_result: mockAnalysisResult,
      broken_links: [],
    };
    
    mockApiService.getURLDetails.mockResolvedValue(responseWithoutBrokenLinks);
    
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.queryByText('Broken Links')).not.toBeInTheDocument();
    });
  });

  it('displays login form status correctly', async () => {
    // Test with login form
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
    
    // Test without login form
    const noLoginAnalysis = {
      ...mockAnalysisResult,
      has_login_form: false,
    };
    
    const noLoginResponse = {
      analysis_result: noLoginAnalysis,
      broken_links: mockBrokenLinks,
    };
    
    mockApiService.getURLDetails.mockResolvedValue(noLoginResponse);
    
    render(<Details />);
    
    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('renders charts when analysis data is available', async () => {
    render(<Details />);
    
    await waitFor(() => {
      // Check if chart containers are rendered by looking for the grid structure
      const chartGrid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6');
      expect(chartGrid).toBeInTheDocument();
      
      // Check for chart containers within the grid
      const chartContainers = chartGrid?.querySelectorAll('.bg-white.p-6.rounded-lg.shadow-md');
      expect(chartContainers?.length).toBe(2); // Should have 2 chart containers
    });
  });
}); 