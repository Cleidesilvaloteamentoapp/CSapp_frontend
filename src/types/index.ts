export * from './client';
export * from './lot';
export * from './invoice';
export * from './service';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  name: string;
  phone?: string;
  avatar_url?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface DashboardStats {
  total_clients: number;
  active_contracts: number;
  pending_invoices: number;
  total_revenue: number;
  overdue_amount: number;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
  recent_payments: Array<{
    id: string;
    client_name: string;
    amount: number;
    paid_at: string;
  }>;
}

export interface ClientDashboard {
  lots: Array<{
    id: string;
    lot_code: string;
    block: string;
    lot_number: string;
    address: string;
    status: string;
  }>;
  next_invoice?: {
    id: string;
    due_date: string;
    amount: number;
    status: string;
  };
  pending_services: number;
  total_paid: number;
  total_pending: number;
}
