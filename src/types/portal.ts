// ===================== Portal do Cliente – Tipos =====================

// ===================== Profile =====================
export interface ClientProfile {
  id: string;
  profile_id: string;
  full_name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
  contract_number: string | null;
  matricula: string | null;
  address: ClientAddress | null;
  photo_url: string | null;
  status: ClientStatus;
  created_at: string;
}

export interface ClientAddress {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
}

export interface ClientProfileUpdate {
  email?: string;
  phone?: string;
  address?: Partial<ClientAddress>;
}

export type ClientStatus = "ACTIVE" | "INACTIVE" | "DEFAULTER" | "RESCINDED";

// ===================== Documents =====================
export type DocumentType =
  // Documentos do Comprador
  | "RG"
  | "CPF"
  | "COMPROVANTE_RESIDENCIA"
  | "CNH"
  | "CERTIDAO_ESTADO_CIVIL"
  | "COMPROVANTE_RENDA"
  // Documentos do Imóvel
  | "MATRICULA"
  | "GUIA_INFORMACAO"
  | "IPTU"
  | "FOTOS_IMOVEL"
  // Outros
  | "CONTRATO"
  | "OUTROS";

export type DocumentCategory = "COMPRADOR" | "IMOVEL" | "OUTROS";

export type DocumentStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface ClientDocument {
  id: string;
  company_id: string;
  client_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  description: string | null;
  tags: string[];
  status: DocumentStatus;
  visible_to_client: boolean;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  // Comprador
  RG: "RG",
  CPF: "CPF",
  COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
  CNH: "CNH",
  CERTIDAO_ESTADO_CIVIL: "Certidão de Estado Civil",
  COMPROVANTE_RENDA: "Comprovante de Renda",
  // Imóvel
  MATRICULA: "Matrícula",
  GUIA_INFORMACAO: "Guia de Informação",
  IPTU: "IPTU",
  FOTOS_IMOVEL: "Fotos do Imóvel",
  // Outros
  CONTRATO: "Contrato",
  OUTROS: "Outros",
};

export const DOCUMENT_TYPE_CATEGORIES: Record<DocumentType, DocumentCategory> = {
  // Comprador
  RG: "COMPRADOR",
  CPF: "COMPRADOR",
  COMPROVANTE_RESIDENCIA: "COMPRADOR",
  CNH: "COMPRADOR",
  CERTIDAO_ESTADO_CIVIL: "COMPRADOR",
  COMPROVANTE_RENDA: "COMPRADOR",
  // Imóvel
  MATRICULA: "IMOVEL",
  GUIA_INFORMACAO: "IMOVEL",
  IPTU: "IMOVEL",
  FOTOS_IMOVEL: "IMOVEL",
  // Outros
  CONTRATO: "OUTROS",
  OUTROS: "OUTROS",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  COMPRADOR: "Documentos do Comprador",
  IMOVEL: "Documentos do Imóvel",
  OUTROS: "Outros Documentos",
};

// Tipos de documentos por categoria para selects organizados
export const DOCUMENT_TYPES_BY_CATEGORY: Record<DocumentCategory, DocumentType[]> = {
  COMPRADOR: ["RG", "CPF", "COMPROVANTE_RESIDENCIA", "CNH", "CERTIDAO_ESTADO_CIVIL", "COMPROVANTE_RENDA"],
  IMOVEL: ["MATRICULA", "GUIA_INFORMACAO", "IPTU", "FOTOS_IMOVEL"],
  OUTROS: ["CONTRATO", "OUTROS"],
};

export const DOCUMENT_STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING_REVIEW: { label: "Em Análise", variant: "outline" },
  APPROVED: { label: "Aprovado", variant: "default" },
  REJECTED: { label: "Rejeitado", variant: "destructive" },
  EXPIRED: { label: "Expirado", variant: "secondary" },
};

// ===================== Service Requests (Tickets) =====================
export type ServiceRequestStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CLIENT"
  | "RESOLVED"
  | "CLOSED";

export type ServiceRequestPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ServiceRequestType =
  | "MANUTENCAO"
  | "SUPORTE"
  | "FINANCEIRO"
  | "DOCUMENTACAO"
  | "OUTROS";

export interface ServiceRequest {
  id: string;
  company_id: string;
  client_id: string;
  ticket_number: string;
  service_type: ServiceRequestType;
  subject: string;
  description: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  assigned_to: string | null;
  assignee_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestCreate {
  service_type: ServiceRequestType;
  subject: string;
  description: string;
  priority?: ServiceRequestPriority;
}

export interface ServiceRequestMessage {
  id: string;
  request_id: string;
  author_id: string;
  author_type: "client" | "admin";
  author_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface ServiceRequestDetail extends ServiceRequest {
  messages: ServiceRequestMessage[];
}

export const REQUEST_STATUS_CONFIG: Record<
  ServiceRequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  OPEN: { label: "Aberta", variant: "outline" },
  IN_PROGRESS: { label: "Em Andamento", variant: "default" },
  WAITING_CLIENT: { label: "Aguardando Você", variant: "secondary" },
  RESOLVED: { label: "Resolvida", variant: "default" },
  CLOSED: { label: "Encerrada", variant: "secondary" },
};

export const REQUEST_PRIORITY_CONFIG: Record<
  ServiceRequestPriority,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  LOW: { label: "Baixa", variant: "secondary" },
  MEDIUM: { label: "Média", variant: "outline" },
  HIGH: { label: "Alta", variant: "default" },
  URGENT: { label: "Urgente", variant: "destructive" },
};

export const REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  MANUTENCAO: "Manutenção",
  SUPORTE: "Suporte",
  FINANCEIRO: "Financeiro",
  DOCUMENTACAO: "Documentação",
  OUTROS: "Outros",
};

// ===================== Notifications =====================
export type NotificationType =
  | "BOLETO_EMITIDO"
  | "BOLETO_VENCIDO"
  | "PAGAMENTO_CONFIRMADO"
  | "DOCUMENTO_APROVADO"
  | "DOCUMENTO_REJEITADO"
  | "SOLICITACAO_ATUALIZADA"
  | "CICLO_PENDENTE"
  | "TRANSFERENCIA_CONTRATO"
  | "ANTECIPACAO_SOLICITADA"
  | "DISTRATO_AUTOMATICO"
  | "GERAL";

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BOLETO_EMITIDO: "Boleto Emitido",
  BOLETO_VENCIDO: "Boleto Vencido",
  PAGAMENTO_CONFIRMADO: "Pagamento Confirmado",
  DOCUMENTO_APROVADO: "Documento Aprovado",
  DOCUMENTO_REJEITADO: "Documento Rejeitado",
  SOLICITACAO_ATUALIZADA: "Solicitação Atualizada",
  CICLO_PENDENTE: "Ciclo Pendente",
  TRANSFERENCIA_CONTRATO: "Transferência de Contrato",
  ANTECIPACAO_SOLICITADA: "Antecipação Solicitada",
  DISTRATO_AUTOMATICO: "Distrato Automático",
  GERAL: "Geral",
};

// ===================== Dashboard =====================
export interface DashboardSummary {
  total_lots: number;
  next_due_date: string | null;
  next_due_amount: number | null;
  pending_invoices: number;
  overdue_invoices: number;
}

export interface ClientLot {
  id: string;
  development_name: string;
  lot_number: string;
  block: string;
  area: number;
  status: string;
}

// ===================== Invoices (uppercase status) =====================
export type PortalInvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export interface PortalInvoice {
  id: string;
  company_id: string;
  client_lot_id: string;
  due_date: string;
  amount: number;
  installment_number: number;
  status: PortalInvoiceStatus;
  asaas_payment_id: string | null;
  barcode: string | null;
  payment_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export const INVOICE_STATUS_CONFIG: Record<
  PortalInvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendente", variant: "outline" },
  PAID: { label: "Pago", variant: "default" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

// ===================== Boleto (portal view) =====================
export interface PortalBoleto {
  id: string;
  client_id: string;
  nosso_numero: string;
  seu_numero: string;
  linha_digitavel: string;
  tipo_cobranca: string;
  data_vencimento: string;
  data_emissao: string;
  data_liquidacao: string | null;
  valor: number;
  valor_liquidacao: number | null;
  status: string;
  pagador_data: { nome: string; cpfCnpj: string } | null;
  tag: 'ENTRADA_PARCELADA' | 'PARCELA_CONTRATO' | 'SERVICO_AVULSO' | 'SEGUNDA_VIA' | 'RENEGOCIACAO' | null;
  installment_label: string | null;
  writeoff_type: 'AUTOMATICA_BANCO' | 'MANUAL_ADMIN' | null;
  created_at: string;
}

export const BOLETO_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NORMAL: { label: "Normal", variant: "outline" },
  LIQUIDADO: { label: "Liquidado", variant: "default" },
  VENCIDO: { label: "Vencido", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
  NEGATIVADO: { label: "Negativado", variant: "destructive" },
  PENDING_APPROVAL: { label: "Pendente", variant: "outline" },
};

// ===================== Referrals =====================
export type ReferralStatus = "pending" | "contacted" | "converted" | "rejected";

export interface PortalReferral {
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

// ===================== Early Payoff (Client) =====================
export type ClientEarlyPayoffStatus = "PENDING" | "CONTACTED" | "COMPLETED" | "CANCELLED";

export interface ClientEarlyPayoffRequest {
  client_lot_id: string;
  client_message?: string;
}

export interface ClientEarlyPayoffResponse {
  id: string;
  company_id: string;
  client_id: string;
  client_lot_id: string;
  status: ClientEarlyPayoffStatus;
  requested_at: string;
  admin_notes: string | null;
  client_message: string | null;
}

export const EARLY_PAYOFF_STATUS_CONFIG: Record<
  ClientEarlyPayoffStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendente", variant: "outline" },
  CONTACTED: { label: "Contactado", variant: "default" },
  COMPLETED: { label: "Concluído", variant: "default" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
};

// ===================== Segunda Via =====================
export interface SegundaViaPreview {
  invoice_id: string;
  installment_number: number;
  original_amount: number;
  penalty: number;
  interest: number;
  corrected_amount: number;
  days_overdue: number;
  new_due_date: string;
}
