import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    institution?: string;
    role?: string;
  }) => api.post('/auth/register', userData),

  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  getProfile: () => api.get('/auth/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    institution?: string;
  }) => api.put('/auth/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.put('/auth/change-password', data),
};

// Reports API
export const reportsAPI = {
  getReports: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
  }) => api.get('/reports', { params }),

  getReport: (id: string) => api.get(`/reports/${id}`),

  deleteReport: (id: string) => api.delete(`/reports/${id}`),

  shareReport: (id: string, settings: { isPublic: boolean; allowComments: boolean }) =>
    api.put(`/reports/${id}/share`, settings),
};

// Analysis API
export const analysisAPI = {
  analyzeFiles: (formData: FormData) => 
    api.post('/analysis/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getAnalysisStatus: (analysisId: string) => 
    api.get(`/analysis/${analysisId}/status`),

  getAnalysisResult: (analysisId: string) => 
    api.get(`/analysis/${analysisId}`),
};

// Users API (for admin)
export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => api.get('/users', { params }),

  getUser: (id: string) => api.get(`/users/${id}`),

  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export default api;
