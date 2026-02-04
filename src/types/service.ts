export interface ServiceType {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  estimated_days?: number;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: string;
  organization_id: string;
  client_lot_id: string;
  service_type_id: string;
  order_number: string;
  description: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  final_cost?: number;
  attachments?: string[];
  notes?: string;
  admin_notes?: string;
  service_type?: ServiceType;
  client_lot?: import('./client').ClientLot;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceOrderData {
  client_lot_id: string;
  service_type_id: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_date?: string;
  attachments?: string[];
}

export interface UpdateServiceOrderData {
  status?: ServiceOrder['status'];
  priority?: ServiceOrder['priority'];
  scheduled_date?: string;
  completed_date?: string;
  estimated_cost?: number;
  final_cost?: number;
  admin_notes?: string;
}

export interface ServiceOrderFilters {
  client_lot_id?: string;
  service_type_id?: string;
  status?: ServiceOrder['status'];
  priority?: ServiceOrder['priority'];
  date_start?: string;
  date_end?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
