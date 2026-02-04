import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data } = await supabase.auth.getSession();

    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject({
        message: 'Você está offline. Verifique sua conexão.',
        isOffline: true,
      });
    }

    const responseData = error.response?.data as { detail?: string | Array<{ msg: string }> };
    let message = 'Erro ao processar requisição';
    
    if (responseData?.detail) {
      if (typeof responseData.detail === 'string') {
        message = responseData.detail;
      } else if (Array.isArray(responseData.detail)) {
        message = responseData.detail.map(e => e.msg).join(', ');
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => 
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const adminApi = {
  dashboard: {
    getStats: () => api.get('/admin/dashboard/stats'),
    getFinancial: () => api.get('/admin/dashboard/financial'),
  },
  clients: {
    list: (params?: Record<string, unknown>) => api.get('/admin/clients', { params }),
    get: (id: string) => api.get(`/admin/clients/${id}`),
    create: (data: unknown) => api.post('/admin/clients', data),
    update: (id: string, data: unknown) => api.put(`/admin/clients/${id}`, data),
    delete: (id: string) => api.delete(`/admin/clients/${id}`),
  },
  developments: {
    list: (params?: Record<string, unknown>) => api.get('/admin/developments', { params }),
    get: (id: string) => api.get(`/admin/developments/${id}`),
    create: (data: unknown) => api.post('/admin/developments', data),
    update: (id: string, data: unknown) => api.put(`/admin/developments/${id}`, data),
  },
  lots: {
    list: (params?: Record<string, unknown>) => api.get('/admin/lots', { params }),
    get: (id: string) => api.get(`/admin/lots/${id}`),
    create: (data: unknown) => api.post('/admin/lots', data),
    update: (id: string, data: unknown) => api.put(`/admin/lots/${id}`, data),
  },
  clientLots: {
    create: (data: unknown) => api.post('/admin/client-lots', data),
  },
  serviceTypes: {
    list: (params?: Record<string, unknown>) => api.get('/admin/service-types', { params }),
    get: (id: string) => api.get(`/admin/service-types/${id}`),
    create: (data: unknown) => api.post('/admin/service-types', data),
    update: (id: string, data: unknown) => api.put(`/admin/service-types/${id}`, data),
  },
  serviceOrders: {
    list: (params?: Record<string, unknown>) => api.get('/admin/service-orders', { params }),
    get: (id: string) => api.get(`/admin/service-orders/${id}`),
    update: (id: string, data: unknown) => api.put(`/admin/service-orders/${id}`, data),
    analytics: (params?: Record<string, unknown>) => api.get('/admin/service-orders/analytics', { params }),
  },
};

export const clientApi = {
  dashboard: {
    get: () => api.get('/client/dashboard'),
  },
  lots: {
    list: () => api.get('/client/lots'),
    getDocuments: (lotId: string) => api.get(`/client/lots/${lotId}/documents`),
  },
  invoices: {
    list: (params?: Record<string, unknown>) => api.get('/client/invoices', { params }),
    get: (id: string) => api.get(`/client/invoices/${id}`),
  },
  serviceTypes: {
    list: () => api.get('/client/service-types'),
  },
  serviceOrders: {
    list: (params?: Record<string, unknown>) => api.get('/client/service-orders', { params }),
    get: (id: string) => api.get(`/client/service-orders/${id}`),
    create: (data: unknown) => api.post('/client/service-orders', data),
  },
  documents: {
    list: () => api.get('/client/documents'),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/client/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
  referrals: {
    list: () => api.get('/client/referrals'),
    create: (data: unknown) => api.post('/client/referrals', data),
  },
};
