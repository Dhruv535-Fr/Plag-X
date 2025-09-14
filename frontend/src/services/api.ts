import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  updateProfile: (data: any) =>
    api.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Reports API
export const reportsAPI = {
  getReports: (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reports?${queryString}`);
  },
  
  getPublicReports: (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reports/public?${queryString}`);
  },
  
  getReport: (id: string) =>
    api.get(`/reports/${id}`),
  
  createReport: (data: any) =>
    api.post('/reports', data),
  
  updateReport: (id: string, data: any) =>
    api.put(`/reports/${id}`, data),
  
  deleteReport: (id: string) =>
    api.delete(`/reports/${id}`),
  
  shareReport: (id: string, userEmail: string, permission: string = 'read') =>
    api.post(`/reports/${id}/share`, { userEmail, permission }),
};

// Analysis API
export const analysisAPI = {
  analyzeFiles: (formData: FormData) => {
    return api.post('/analysis/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for file analysis
    });
  },
  
  quickCompare: (text1: string, text2: string, title?: string) =>
    api.post('/analysis/quick-compare', { text1, text2, title }),
  
  getSupportedTypes: () =>
    api.get('/analysis/supported-types'),
  
  getStats: () =>
    api.get('/analysis/stats'),
};

// Users API
export const usersAPI = {
  getUsers: (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users?${queryString}`);
  },
  
  getProfile: () =>
    api.get('/users/profile'),
};

export default api;
