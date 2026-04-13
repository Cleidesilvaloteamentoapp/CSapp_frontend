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

export type UserRole = "super_admin" | "company_admin" | "staff" | "client";

export interface MeResponse {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  is_active: boolean;
}

// ===================== Auth - Password =====================
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
}

// ===================== Superadmin =====================
export interface SuperadminCreateRequest {
  full_name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  password: string;
}

// ===================== Staff =====================
export interface StaffPermissions {
  view_clients: boolean;
  manage_clients: boolean;
  view_lots: boolean;
  manage_lots: boolean;
  view_financial: boolean;
  manage_financial: boolean;
  view_renegotiations: boolean;
  manage_renegotiations: boolean;
  view_rescissions: boolean;
  manage_rescissions: boolean;
  view_reports: boolean;
  view_service_requests: boolean;
  manage_service_requests: boolean;
  view_documents: boolean;
  manage_documents: boolean;
  view_sicredi: boolean;
  manage_sicredi: boolean;
  view_whatsapp: boolean;
  manage_whatsapp: boolean;
  view_financial_settings: boolean;
  manage_financial_settings: boolean;
}

export interface StaffResponse {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  is_active: boolean;
  permissions: StaffPermissions | null;
}

export interface StaffCreateRequest {
  full_name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  password: string;
  permissions?: StaffPermissions;
}

export interface StaffUpdateRequest {
  full_name?: string;
  phone?: string;
  password?: string;
  permissions?: StaffPermissions;
}

export interface StaffToggleResponse {
  id: string;
  is_active: boolean;
  message: string;
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

// ===================== Property Types =====================
export type PropertyType = "LOT" | "HOUSE" | "APARTMENT" | "COMMERCIAL" | "RURAL";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  LOT: "Lote",
  HOUSE: "Casa",
  APARTMENT: "Apartamento", 
  COMMERCIAL: "Comercial",
  RURAL: "Rural",
};

export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  LOT: "🏗️",
  HOUSE: "🏠",
  APARTMENT: "🏢",
  COMMERCIAL: "🏪",
  RURAL: "🌾",
};

// ===================== Development =====================
export interface DevelopmentCreate {
  name: string;
  description?: string;
  location?: string;
  property_type: PropertyType;
  // Campos específicos para lotes
  block?: string;
  lot_number?: string;
  area_m2?: number;
  // Campos específicos para casas/apartamentos
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parking_spaces?: number;
  construction_area_m2?: number;
  total_area_m2?: number;
  // Campos para imóveis em geral
  price?: number;
  documents?: Record<string, unknown>;
}

export interface DevelopmentUpdate {
  name?: string;
  description?: string;
  location?: string;
  property_type?: PropertyType;
  block?: string;
  lot_number?: string;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parking_spaces?: number;
  construction_area_m2?: number;
  total_area_m2?: number;
  price?: number;
  documents?: Record<string, unknown>;
}

export interface DevelopmentResponse {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  location: string | null;
  property_type: PropertyType;
  block: string | null;
  lot_number: string | null;
  area_m2: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spaces: number | null;
  construction_area_m2: string | null;
  total_area_m2: string | null;
  price: string | null;
  documents: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ===================== Lot =====================
export type LotStatus = "AVAILABLE" | "RESERVED" | "SOLD";

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

export type AdjustmentIndex = "IPCA" | "IGPM" | "CUB" | "INPC";
export type AdjustmentFrequency = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

export interface ClientLotResponse {
  id: string;
  company_id: string;
  client_id: string;
  lot_id: string;
  purchase_date: string;
  total_value: number;
  down_payment: number | null;
  total_installments: number;
  current_cycle: number;
  current_installment_value: number | null;
  annual_adjustment_rate: number | null;
  last_adjustment_date: string | null;
  last_cycle_paid_at: string | null;
  penalty_rate: number | null;
  daily_interest_rate: number | null;
  adjustment_index: AdjustmentIndex | null;
  adjustment_frequency: AdjustmentFrequency | null;
  adjustment_custom_rate: number | null;
  previous_client_id: string | null;
  transfer_date: string | null;
  payment_plan: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyFinancialSettingsResponse {
  id: string;
  company_id: string;
  penalty_rate: number;
  daily_interest_rate: number;
  adjustment_index: AdjustmentIndex;
  adjustment_frequency: AdjustmentFrequency;
  adjustment_custom_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyFinancialSettingsUpdate {
  penalty_rate?: number;
  daily_interest_rate?: number;
  adjustment_index?: AdjustmentIndex;
  adjustment_frequency?: AdjustmentFrequency;
  adjustment_custom_rate?: number;
}

export interface ClientLotFinancialRulesUpdate {
  penalty_rate?: number | null;
  daily_interest_rate?: number | null;
  adjustment_index?: AdjustmentIndex | null;
  adjustment_frequency?: AdjustmentFrequency | null;
  adjustment_custom_rate?: number | null;
  annual_adjustment_rate?: number | null;
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

// ===================== Boleto Tag =====================
export type BoletoTag =
  | "ENTRADA_PARCELADA"
  | "PARCELA_CONTRATO"
  | "SERVICO_AVULSO"
  | "SEGUNDA_VIA"
  | "RENEGOCIACAO";

export const TAG_CONFIG: Record<
  BoletoTag,
  { label: string; color: string; bg: string }
> = {
  ENTRADA_PARCELADA: { label: "Entrada Parcelada", color: "text-blue-700", bg: "bg-blue-100" },
  PARCELA_CONTRATO: { label: "Parcela de Contrato", color: "text-green-700", bg: "bg-green-100" },
  SERVICO_AVULSO: { label: "Serviço Avulso", color: "text-orange-700", bg: "bg-orange-100" },
  SEGUNDA_VIA: { label: "Segunda Via", color: "text-yellow-700", bg: "bg-yellow-100" },
  RENEGOCIACAO: { label: "Renegociação", color: "text-purple-700", bg: "bg-purple-100" },
};

// ===================== Economic Index =====================
export type IndexType = "IPCA" | "IGPM" | "CUB" | "INPC";
export type IndexSource = "MANUAL" | "BCB_API";

export interface EconomicIndexResponse {
  id: string;
  company_id: string;
  index_type: IndexType;
  state_code: string | null;
  reference_month: string;
  value: number;
  source: IndexSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EconomicIndexCreate {
  index_type: IndexType;
  reference_month: string;
  value: number;
  state_code?: string;
}

export interface EconomicIndexUpdate {
  value: number;
}

// ===================== Cycle Approval =====================
export type CycleApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CycleApprovalResponse {
  id: string;
  company_id: string;
  client_lot_id: string;
  cycle_number: number;
  status: CycleApprovalStatus;
  previous_installment_value: number;
  new_installment_value: number | null;
  adjustment_details: Record<string, unknown> | null;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  client_name: string | null;
  lot_identifier: string | null;
  total_installments: number | null;
}

// ===================== Contract Transfer =====================
export type TransferStatus = "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED";

export interface ContractTransferResponse {
  id: string;
  company_id: string;
  client_lot_id: string;
  from_client_id: string;
  to_client_id: string;
  status: TransferStatus;
  transfer_fee: number | null;
  transfer_date: string | null;
  reason: string | null;
  admin_notes: string | null;
  from_client_name: string | null;
  to_client_name: string | null;
  lot_identifier: string | null;
}

export interface ContractTransferCreate {
  client_lot_id: string;
  to_client_id: string;
  transfer_fee?: number;
  reason?: string;
}

// ===================== Early Payoff =====================
export type EarlyPayoffStatus = "PENDING" | "CONTACTED" | "COMPLETED" | "CANCELLED";

export interface EarlyPayoffResponse {
  id: string;
  company_id: string;
  client_id: string;
  client_lot_id: string;
  status: EarlyPayoffStatus;
  requested_at: string;
  admin_notes: string | null;
  client_message: string | null;
  client_name?: string | null;
  lot_identifier?: string | null;
}

// ===================== Defaulter Detail (Enhanced) =====================
export interface DefaulterDetail {
  client_id: string;
  client_name: string;
  cpf_cnpj: string;
  phone: string;
  overdue_invoices: number;
  overdue_amount: number;
  oldest_due_date: string | null;
  days_overdue: number;
}

// ===================== Status Color Helpers =====================
export const WORKFLOW_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  PENDING: { label: "Pendente", variant: "outline", color: "text-yellow-600" },
  APPROVED: { label: "Aprovado", variant: "default", color: "text-green-600" },
  REJECTED: { label: "Rejeitado", variant: "destructive", color: "text-red-600" },
  COMPLETED: { label: "Concluído", variant: "default", color: "text-blue-600" },
  CANCELLED: { label: "Cancelado", variant: "secondary", color: "text-gray-500" },
  CONTACTED: { label: "Contactado", variant: "outline", color: "text-blue-500" },
};

// ===================== Manual Writeoff =====================
export interface ManualWriteoffRequest {
  reason: string;
  valor_liquidacao?: number;
  data_liquidacao?: string;
}

// ===================== Installment Management (12x12 Cycle) =====================
export interface InstallmentInfo {
  client_lot_id: string;
  total_installments: number;
  paid_installments: number;
  remaining_installments: number;
  current_cycle: number;
  next_cycle_number: number;
  installments_in_current_cycle: number;
  is_legacy_client: boolean;
  current_installment_value: number | null;
}

export interface GenerateNextBatchResponse {
  status: "ready_for_batch";
  client_lot_id: string;
  current_cycle: number;
  previous_installment_value: number;
  new_installment_value: number;
  adjustment_rate: number;
  remaining_installments: number;
  message: string;
}

// ===================== Admin Notifications =====================
export type AdminNotificationType =
  | "CICLO_PENDENTE"
  | "TRANSFERENCIA_SOLICITADA"
  | "ANTECIPACAO_SOLICITADA"
  | "DOCUMENTO_PENDENTE"
  | "BOLETO_VENCIDO"
  | "GERAL";

export interface AdminNotification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: AdminNotificationType;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export const ADMIN_NOTIFICATION_TYPE_LABELS: Record<AdminNotificationType, string> = {
  CICLO_PENDENTE: "Ciclo Pendente",
  TRANSFERENCIA_SOLICITADA: "Transferência Solicitada",
  ANTECIPACAO_SOLICITADA: "Antecipação Solicitada",
  DOCUMENTO_PENDENTE: "Documento Pendente",
  BOLETO_VENCIDO: "Boleto Vencido",
  GERAL: "Geral",
};

// ===================== Sicredi =====================
export * from "./sicredi";
