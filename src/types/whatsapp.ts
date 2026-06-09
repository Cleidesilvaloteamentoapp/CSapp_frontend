// ===================== WhatsApp Credential Types =====================

export type WhatsAppProvider = "UAZAPI" | "META";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "unknown"
  | "error";

export interface WhatsAppCredentialResponse {
  id: string;
  company_id: string;
  provider: WhatsAppProvider;
  is_active: boolean;
  is_default: boolean;
  uazapi_base_url?: string;
  meta_waba_id?: string;
  meta_phone_number_id?: string;
  connection_status?: ConnectionStatus;
  last_status_check?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUAZAPICredential {
  provider: "UAZAPI";
  uazapi_base_url: string;
  uazapi_instance_token: string;
  is_default?: boolean;
}

export interface CreateMetaCredential {
  provider: "META";
  meta_waba_id: string;
  meta_phone_number_id: string;
  meta_access_token: string;
  is_default?: boolean;
}

export type CreateWhatsAppCredential =
  | CreateUAZAPICredential
  | CreateMetaCredential;

export interface UpdateWhatsAppCredential {
  uazapi_base_url?: string;
  uazapi_instance_token?: string;
  meta_waba_id?: string;
  meta_phone_number_id?: string;
  meta_access_token?: string;
  is_default?: boolean;
}

export interface ConnectionStatusResponse {
  connected: boolean;
  status: string;
  profile_name?: string;
  phone_number?: string;
  error?: string;
}

export interface TestMessageRequest {
  to: string;
  body: string;
  credential_id?: string;
}

// ===================== WhatsApp Template Types =====================

export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";
export type TemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  parameters?: Array<{ type: string; text?: string }>;
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
}

export interface TemplateResponse {
  id?: string;
  name: string;
  status: TemplateStatus;
  category: string;
  language: string;
  components: TemplateComponent[];
}

export interface CreateTemplateRequest {
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponent[];
}

// ===================== Notification Settings Types =====================

export interface NotificationSettingsResponse {
  id: string;
  company_id: string;
  // Client toggles
  notify_client_new_boleto: boolean;
  notify_client_due_reminder: boolean;
  notify_client_overdue: boolean;
  notify_client_service: boolean;
  // Admin toggles
  notify_admin_client_created: boolean;
  notify_admin_client_deleted: boolean;
  notify_admin_boleto_generated: boolean;
  notify_admin_boleto_cancelled: boolean;
  notify_admin_cycle_request: boolean;
  // Admin WhatsApp numbers (comma-separated)
  admin_whatsapp_numbers?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettingsUpdate {
  notify_client_new_boleto?: boolean;
  notify_client_due_reminder?: boolean;
  notify_client_overdue?: boolean;
  notify_client_service?: boolean;
  notify_admin_client_created?: boolean;
  notify_admin_client_deleted?: boolean;
  notify_admin_boleto_generated?: boolean;
  notify_admin_boleto_cancelled?: boolean;
  notify_admin_cycle_request?: boolean;
  admin_whatsapp_numbers?: string;
}
