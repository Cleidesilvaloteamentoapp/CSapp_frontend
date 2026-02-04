export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  client_lot_id: string;
  asaas_payment_id?: string;
  due_date: string;
  amount: number;
  status: InvoiceStatus;
  installment_number: number;
  barcode?: string;
  payment_url?: string;
  paid_at?: string;
  created_at: string;
  lot_number?: string;
  development_name?: string;
}

export interface InvoiceFilters {
  client_lot_id?: string;
  status?: InvoiceStatus;
  page?: number;
  page_size?: number;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  total_pending: number;
  total_paid: number;
  total_overdue: number;
}
