export * from './client';
export * from './lot';
export * from './invoice';
export * from './service';

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  cpf_cnpj?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export interface AdminDashboardStats {
  total_clients: number;
  active_clients: number;
  defaulter_clients: number;
  total_lots: number;
  available_lots: number;
  sold_lots: number;
  open_service_orders: number;
  completed_service_orders: number;
}

export interface Defaulter {
  client_id: string;
  client_name: string;
  cpf_cnpj: string;
  phone: string;
  overdue_amount: number;
  overdue_invoices_count: number;
  oldest_overdue_date: string;
}

export interface AdminDashboardFinancial {
  total_receivables: number;
  total_received: number;
  total_overdue: number;
  defaulters: Defaulter[];
  revenue_from_services: number;
  service_costs: number;
  service_profit: number;
}

export interface ClientDashboardLot {
  client_lot_id: string;
  lot_number: string;
  area_m2: number;
  development_name: string;
  total_value: number;
  status: string;
}

export interface ClientNotification {
  id: string;
  type: 'payment_overdue' | 'service_update' | 'general';
  title: string;
  message: string;
  created_at: string;
}

export interface ClientDashboard {
  client_name: string;
  total_lots: number;
  lots: ClientDashboardLot[];
  pending_invoices: number;
  total_pending_amount: number;
  next_due_date: string | null;
  open_service_orders: number;
  recent_notifications: ClientNotification[];
}
