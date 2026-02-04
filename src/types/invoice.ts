export interface Invoice {
  id: string;
  organization_id: string;
  client_lot_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  paid_amount?: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  barcode?: string;
  boleto_url?: string;
  pix_code?: string;
  notes?: string;
  client_lot?: import('./client').ClientLot;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFilters {
  client_lot_id?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date_start?: string;
  due_date_end?: string;
  page?: number;
  per_page?: number;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'boleto' | 'pix' | 'transfer' | 'cash' | 'card';
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface FinancialSummary {
  total_receivable: number;
  total_received: number;
  total_overdue: number;
  pending_count: number;
  paid_count: number;
  overdue_count: number;
  monthly_data: Array<{
    month: string;
    received: number;
    pending: number;
    overdue: number;
  }>;
}
