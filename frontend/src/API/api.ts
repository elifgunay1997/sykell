import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_TOKEN = 'sykell-api-token-2025';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface URL {
  id: number;
  url: string;
  status: 'queued' | 'running' | 'done' | 'error';
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: number;
  url_id: number;
  url: URL;
  title: string;
  html_version: string;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  h4_count: number;
  h5_count: number;
  h6_count: number;
  internal_links: number;
  external_links: number;
  broken_links: number;
  has_login_form: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrokenLink {
  id: number;
  analysis_id: number;
  url: string;
  status_code: number;
  error_message: string;
}

export interface URLListResponse {
  urls: URL[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalysisDetailResponse {
  analysis_result: AnalysisResult;
  broken_links: BrokenLink[];
}

export interface CreateURLRequest {
  url: string;
}

// API functions
export const apiService = {
  // Create a new URL for analysis
  createURL: async (data: CreateURLRequest): Promise<URL> => {
    const response = await api.post<URL>('/api/urls', data);
    return response.data;
  },

  // Get URLs with pagination and filters
  getURLs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    sort_field?: string;
    sort_direction?: 'asc' | 'desc';
  }): Promise<URLListResponse> => {
    const response = await api.get<URLListResponse>('/api/urls', { params });
    return response.data;
  },

  // Get URL details with analysis results
  getURLDetails: async (id: number): Promise<AnalysisDetailResponse> => {
    const response = await api.get<AnalysisDetailResponse>(`/api/urls/${id}`);
    return response.data;
  },

  // Delete multiple URLs
  deleteURLs: async (ids: number[]): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>('/api/urls', {
      data: { ids },
    });
    return response.data;
  },

  // Re-analyze a URL
  reanalyzeURL: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/api/urls/${id}/reanalyze`);
    return response.data;
  },
};

export default api; 