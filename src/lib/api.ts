import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

    if (!navigator.onLine) {
      return Promise.reject({
        message: 'Você está offline. Verifique sua conexão.',
        isOffline: true,
      });
    }

    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'Erro ao processar requisição';

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

export const adminApi = {
  dashboard: {
    getStats: () => api.get('/admin/dashboard/stats'),
  },
  clients: {
    list: (params?: Record<string, unknown>) => api.get('/admin/clients', { params }),
    get: (id: string) => api.get(`/admin/clients/${id}`),
    create: (data: unknown) => api.post('/admin/clients', data),
    update: (id: string, data: unknown) => api.put(`/admin/clients/${id}`, data),
    delete: (id: string) => api.delete(`/admin/clients/${id}`),
  },
  lots: {
    list: (params?: Record<string, unknown>) => api.get('/admin/lots', { params }),
    get: (id: string) => api.get(`/admin/lots/${id}`),
    create: (data: unknown) => api.post('/admin/lots', data),
    update: (id: string, data: unknown) => api.put(`/admin/lots/${id}`, data),
    delete: (id: string) => api.delete(`/admin/lots/${id}`),
  },
  invoices: {
    list: (params?: Record<string, unknown>) => api.get('/admin/invoices', { params }),
    get: (id: string) => api.get(`/admin/invoices/${id}`),
    create: (data: unknown) => api.post('/admin/invoices', data),
    update: (id: string, data: unknown) => api.put(`/admin/invoices/${id}`, data),
    markAsPaid: (id: string, data: unknown) => api.post(`/admin/invoices/${id}/pay`, data),
  },
  serviceOrders: {
    list: (params?: Record<string, unknown>) => api.get('/admin/service-orders', { params }),
    get: (id: string) => api.get(`/admin/service-orders/${id}`),
    update: (id: string, data: unknown) => api.put(`/admin/service-orders/${id}`, data),
  },
  serviceTypes: {
    list: (params?: Record<string, unknown>) => api.get('/admin/service-types', { params }),
    get: (id: string) => api.get(`/admin/service-types/${id}`),
    create: (data: unknown) => api.post('/admin/service-types', data),
    update: (id: string, data: unknown) => api.put(`/admin/service-types/${id}`, data),
    delete: (id: string) => api.delete(`/admin/service-types/${id}`),
  },
  developments: {
    list: (params?: Record<string, unknown>) => api.get('/admin/developments', { params }),
    get: (id: string) => api.get(`/admin/developments/${id}`),
    create: (data: unknown) => api.post('/admin/developments', data),
    update: (id: string, data: unknown) => api.put(`/admin/developments/${id}`, data),
  },
};

export const clientApi = {
  dashboard: {
    get: () => api.get('/client/dashboard'),
  },
  lots: {
    list: () => api.get('/client/lots'),
    get: (id: string) => api.get(`/client/lots/${id}`),
  },
  invoices: {
    list: (params?: Record<string, unknown>) => api.get('/client/invoices', { params }),
    get: (id: string) => api.get(`/client/invoices/${id}`),
    downloadBoleto: (id: string) => api.get(`/client/invoices/${id}/boleto`, { responseType: 'blob' }),
  },
  serviceOrders: {
    list: (params?: Record<string, unknown>) => api.get('/client/service-orders', { params }),
    get: (id: string) => api.get(`/client/service-orders/${id}`),
    create: (data: unknown) => api.post('/client/service-orders', data),
  },
  serviceTypes: {
    list: () => api.get('/client/service-types'),
  },
  documents: {
    list: () => api.get('/client/documents'),
    get: (id: string) => api.get(`/client/documents/${id}`),
    download: (id: string) => api.get(`/client/documents/${id}/download`, { responseType: 'blob' }),
  },
  referrals: {
    list: () => api.get('/client/referrals'),
    create: (data: unknown) => api.post('/client/referrals', data),
  },
  profile: {
    get: () => api.get('/client/profile'),
    update: (data: unknown) => api.put('/client/profile', data),
  },
};
