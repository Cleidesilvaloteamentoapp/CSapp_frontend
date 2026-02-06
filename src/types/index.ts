// ===================== Auth =====================
export interface SignupRequest {
  company_name: string;
  company_slug: string;
  full_name: string;
  email: string;
  password: string;
  cpf_cnpj: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export type UserRole = "super_admin" | "company_admin" | "client";

export interface MeResponse {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
}

// ===================== Company =====================
export type CompanyStatus = "active" | "suspended" | "inactive";

export interface CompanyCreate {
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
}

export interface CompanyUpdate {
  name?: string;
  slug?: string;
  settings?: Record<string, unknown>;
}

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown> | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

// ===================== Client =====================
export type ClientStatus = "active" | "inactive" | "defaulter";

export interface ClientCreate {
  email: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  address?: Record<string, unknown>;
  create_access?: boolean;
  password?: string;
}

export interface ClientUpdate {
  email?: string;
  full_name?: string;
  cpf_cnpj?: string;
  phone?: string;
  address?: Record<string, unknown>;
  status?: ClientStatus;
}

export interface ClientResponse {
  id: string;
  company_id: string;
  profile_id: string | null;
  email: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  address: Record<string, unknown> | null;
  documents: unknown[] | null;
  status: ClientStatus;
  asaas_customer_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Development =====================
export interface DevelopmentCreate {
  name: string;
  description?: string;
  location?: string;
  documents?: Record<string, unknown>;
}

export interface DevelopmentUpdate {
  name?: string;
  description?: string;
  location?: string;
  documents?: Record<string, unknown>;
}

export interface DevelopmentResponse {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  location: string | null;
  documents: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ===================== Lot =====================
export type LotStatus = "available" | "reserved" | "sold";

export interface LotCreate {
  development_id: string;
  lot_number: string;
  block?: string;
  area_m2: number;
  price: number;
  documents?: Record<string, unknown>;
}

export interface LotUpdate {
  lot_number?: string;
  block?: string;
  area_m2?: number;
  price?: number;
  status?: LotStatus;
  documents?: Record<string, unknown>;
}

export interface LotResponse {
  id: string;
  company_id: string;
  development_id: string;
  lot_number: string;
  block: string | null;
  area_m2: string;
  price: string;
  status: LotStatus;
  documents: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ===================== Lot Assignment =====================
export interface LotAssignRequest {
  client_id: string;
  lot_id: string;
  purchase_date: string;
  total_value: number;
  payment_plan?: {
    installments?: number;
    first_due?: string;
    down_payment?: number;
    monthly_value?: number;
  };
}

export interface ClientLotResponse {
  id: string;
  company_id: string;
  client_id: string;
  lot_id: string;
  purchase_date: string;
  total_value: string;
  payment_plan: Record<string, unknown> | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// ===================== Invoice =====================
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface InvoiceResponse {
  id: string;
  company_id: string;
  client_lot_id: string;
  due_date: string;
  amount: string;
  installment_number: number;
  status: InvoiceStatus;
  asaas_payment_id: string | null;
  barcode: string | null;
  payment_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Service =====================
export interface ServiceTypeCreate {
  name: string;
  description?: string;
  base_price?: number;
  is_active?: boolean;
}

export interface ServiceTypeResponse {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  base_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceOrderStatus =
  | "requested"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceOrderCreate {
  service_type_id: string;
  lot_id?: string;
  notes?: string;
}

export interface ServiceOrderResponse {
  id: string;
  company_id: string;
  client_id: string;
  lot_id: string | null;
  service_type_id: string;
  requested_date: string;
  execution_date: string | null;
  status: ServiceOrderStatus;
  cost: string;
  revenue: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Referral =====================
export type ReferralStatus = "pending" | "contacted" | "converted" | "lost";

export interface ReferralCreate {
  referred_name: string;
  referred_phone: string;
  referred_email?: string;
}

export interface ReferralResponse {
  id: string;
  company_id: string;
  referrer_client_id: string;
  referred_name: string;
  referred_phone: string;
  referred_email: string | null;
  status: ReferralStatus;
  created_at: string;
  updated_at: string;
}

// ===================== Dashboard =====================
export interface AdminStats {
  total_clients: number;
  active_clients: number;
  defaulter_clients: number;
  open_service_orders: number;
  completed_service_orders: number;
  total_lots: number;
  available_lots: number;
  sold_lots: number;
}

export interface FinancialOverview {
  total_receivable: string;
  total_received: string;
  total_overdue: string;
  overdue_count: number;
}

export interface RevenueChart {
  month: string;
  amount: string;
}

export interface ClientSummary {
  total_lots: number;
  next_due_date: string | null;
  next_due_amount: string | null;
  pending_invoices: number;
  overdue_invoices: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

export interface DefaulterInfo {
  client_id: string;
  client_name: string;
  overdue_months: number;
  overdue_amount: string;
}

// ===================== Documents =====================
export interface DocumentResponse {
  id: string;
  filename: string;
  url: string;
  content_type: string;
  size: number;
  uploaded_by: string;
  client_id: string;
  created_at: string;
}

// ===================== Client Dashboard =====================
export interface ClientDashboard {
  lots_count: number;
  pending_invoices: number;
  overdue_invoices: number;
  active_services: number;
  next_invoices: Array<{
    id: string;
    installment_number: number;
    due_date: string;
    amount: string;
    status: string;
  }>;
}

// ===================== Pagination =====================
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ===================== API Error =====================
export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}
