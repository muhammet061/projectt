import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string) => 
    api.post('/api/auth/register', { email, password }),
};

// Files API
export const filesAPI = {
  upload: (formData: FormData) => 
    api.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getUserFiles: () => api.get('/api/files'),
  deleteFile: (uuid: string) => api.delete(`/api/files/${uuid}`),
  getFileInfo: (uuid: string) => api.get(`/api/files/info/${uuid}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: () => api.get('/api/admin/users'),
  getFiles: () => api.get('/api/admin/files'),
  deleteFile: (id: number) => api.delete(`/api/admin/files/${id}`),
};

export default api;