import { api } from "@/lib/api";
import type {
  WhatsAppCredentialResponse,
  CreateWhatsAppCredential,
  UpdateWhatsAppCredential,
  ConnectionStatusResponse,
  TestMessageRequest,
  TemplateResponse,
  CreateTemplateRequest,
  NotificationSettingsResponse,
  NotificationSettingsUpdate,
} from "@/types/whatsapp";

// ===================== Credentials =====================

export async function listWhatsAppCredentials(): Promise<
  WhatsAppCredentialResponse[]
> {
  return api.get<WhatsAppCredentialResponse[]>(
    "/admin/whatsapp/credentials"
  );
}

export async function createWhatsAppCredential(
  data: CreateWhatsAppCredential
): Promise<WhatsAppCredentialResponse> {
  return api.post<WhatsAppCredentialResponse>(
    "/admin/whatsapp/credentials",
    data
  );
}

export async function updateWhatsAppCredential(
  id: string,
  data: UpdateWhatsAppCredential
): Promise<WhatsAppCredentialResponse> {
  return api.patch<WhatsAppCredentialResponse>(
    `/admin/whatsapp/credentials/${id}`,
    data
  );
}

export async function deleteWhatsAppCredential(
  id: string
): Promise<void> {
  await api.delete(`/admin/whatsapp/credentials/${id}`);
}

export async function setDefaultWhatsAppCredential(
  id: string
): Promise<WhatsAppCredentialResponse> {
  return api.post<WhatsAppCredentialResponse>(
    `/admin/whatsapp/credentials/${id}/set-default`
  );
}

export async function checkWhatsAppConnectionStatus(
  id: string
): Promise<ConnectionStatusResponse> {
  return api.get<ConnectionStatusResponse>(
    `/admin/whatsapp/credentials/${id}/status`
  );
}

export async function sendWhatsAppTestMessage(
  data: TestMessageRequest
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    "/admin/whatsapp/test-message",
    data
  );
}

// ===================== Templates (Meta Cloud API) =====================

export async function listWhatsAppTemplates(
  credentialId?: string
): Promise<TemplateResponse[]> {
  const qs = credentialId ? `?credential_id=${credentialId}` : "";
  return api.get<TemplateResponse[]>(`/admin/whatsapp/templates${qs}`);
}

export async function createWhatsAppTemplate(
  data: CreateTemplateRequest,
  credentialId?: string
): Promise<TemplateResponse> {
  const qs = credentialId ? `?credential_id=${credentialId}` : "";
  return api.post<TemplateResponse>(
    `/admin/whatsapp/templates${qs}`,
    data
  );
}

export async function getWhatsAppTemplate(
  name: string,
  credentialId?: string
): Promise<TemplateResponse> {
  const qs = credentialId ? `?credential_id=${credentialId}` : "";
  return api.get<TemplateResponse>(
    `/admin/whatsapp/templates/${name}${qs}`
  );
}

export async function deleteWhatsAppTemplate(
  name: string,
  credentialId?: string
): Promise<void> {
  const qs = credentialId ? `?credential_id=${credentialId}` : "";
  await api.delete(`/admin/whatsapp/templates/${name}${qs}`);
}

// ===================== Notification Settings =====================

export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  return api.get<NotificationSettingsResponse>(
    "/admin/whatsapp/notification-settings"
  );
}

export async function updateNotificationSettings(
  data: NotificationSettingsUpdate
): Promise<NotificationSettingsResponse> {
  return api.put<NotificationSettingsResponse>(
    "/admin/whatsapp/notification-settings",
    data
  );
}
