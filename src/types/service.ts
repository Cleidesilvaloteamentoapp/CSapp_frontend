export type ServiceOrderStatus = 'requested' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateServiceTypeData {
  name: string;
  description?: string;
  base_price: number;
  is_active?: boolean;
}

export interface UpdateServiceTypeData {
  name?: string;
  description?: string;
  base_price?: number;
  is_active?: boolean;
}

export interface ServiceOrder {
  id: string;
  client_id: string;
  client_name?: string;
  lot_id?: string;
  lot_number?: string;
  service_type_id: string;
  service_type_name?: string;
  requested_date: string;
  execution_date?: string;
  status: ServiceOrderStatus;
  cost: number;
  revenue?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceOrderData {
  lot_id: string;
  service_type_id: string;
  requested_date: string;
  notes?: string;
}

export interface UpdateServiceOrderData {
  status?: ServiceOrderStatus;
  execution_date?: string;
  cost?: number;
  revenue?: number;
  notes?: string;
}

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus;
  client_id?: string;
  page?: number;
  page_size?: number;
}

export interface ServiceOrderAnalytics {
  total_orders: number;
  total_cost: number;
  total_revenue: number;
  profit: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
}
