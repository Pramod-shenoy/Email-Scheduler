import axios, { AxiosResponse } from 'axios';
import {
  AuthResponse,
  EmailJob,
  EmailSend,
  PaginatedResponse,
  ScheduleEmailRequest,
  CSVParseResult,
  QueueStats
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.accessToken) {
        config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const refreshToken = parsed.state?.refreshToken;

          if (refreshToken) {
            const response = await authApi.refreshToken(refreshToken);

            // Update stored token
            parsed.state.accessToken = response.accessToken;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  googleLogin: async (token: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/google', { token });
    return response.data;
  },

  devLogin: async (email: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/dev-login', { email });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response: AxiosResponse<{ accessToken: string }> = await api.post('/auth/refresh', {
      refreshToken
    });
    return response.data;
  },
};

// Email API
export const emailApi = {
  getEmailJob: async (id: string): Promise<any> => {
    const response = await api.get(`/api/emails/job/${id}`);
    return response.data;
  },

  getEmailSend: async (id: string): Promise<any> => {
    const response = await api.get(`/api/emails/send/${id}`);
    return response.data;
  },

  scheduleEmails: async (data: ScheduleEmailRequest | FormData): Promise<{ message: string; jobId: string }> => {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const body = isFormData ? data : JSON.stringify(data);

    const response = await api.post('/api/emails/schedule', body, {
      headers: {
        ...headers
      }
    });
    return response.data;
  },

  parseCSV: async (file: File): Promise<CSVParseResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<CSVParseResult> = await api.post(
      '/api/emails/parse-csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getScheduledEmails: async (page = 1, limit = 20, search?: string, status?: string, statuses?: string[]): Promise<{
    jobs: EmailJob[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    let url = `/api/emails/scheduled?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (statuses && statuses.length > 0) url += `&statuses=${encodeURIComponent(statuses.join(','))}`;
    const response = await api.get(url);
    return response.data;
  },

  getSentEmails: async (page = 1, limit = 20, search?: string, status?: string): Promise<{
    emails: EmailSend[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    let url = `/api/emails/sent?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const response = await api.get(url);
    return response.data;
  },

  getStats: async (): Promise<{
    queue: QueueStats;
    rateLimit: { [hourKey: string]: number };
    counts: { scheduled: number; sent: number };
  }> => {
    const response = await api.get('/api/emails/stats');
    return response.data;
  },

  cancelJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/emails/${jobId}`);
    return response.data;
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<{
    status: string;
    checks: {
      database: boolean;
      redis: boolean;
      smtp: boolean;
      timestamp: string;
    };
  }> => {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api;