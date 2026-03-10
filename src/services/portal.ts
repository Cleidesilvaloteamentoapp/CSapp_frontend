import { api } from "@/lib/api";
import type {
  ClientProfile,
  ClientProfileUpdate,
  ClientDocument,
  DocumentType,
  ServiceRequest,
  ServiceRequestCreate,
  ServiceRequestDetail,
  ServiceRequestMessage,
  Notification,
  DashboardSummary,
  ClientLot,
  PortalInvoice,
  PortalBoleto,
  PortalReferral,
  SegundaViaPreview,
} from "@/types/portal";
import type { PaginatedResponse } from "@/types";

// ===================== Profile =====================

export async function getClientProfile(): Promise<ClientProfile> {
  return api.get<ClientProfile>("/client/profile");
}

export async function updateClientProfile(
  data: ClientProfileUpdate
): Promise<ClientProfile> {
  return api.patch<ClientProfile>("/client/profile", data);
}

// ===================== Dashboard =====================

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>("/client/dashboard/summary");
}

export async function getMyLots(): Promise<ClientLot[]> {
  return api.get<ClientLot[]>("/client/dashboard/my-lots");
}

// ===================== Boletos =====================

export async function listPortalBoletos(
  status?: string
): Promise<PortalBoleto[]> {
  const params = status ? `?status=${status}` : "";
  return api.get<PortalBoleto[]>(`/client/boletos${params}`);
}

export async function getPortalBoletoDetail(
  nossoNumero: string
): Promise<Record<string, unknown>> {
  return api.get<Record<string, unknown>>(`/client/boletos/${nossoNumero}`);
}

export async function downloadPortalBoletoPdf(
  nossoNumero: string
): Promise<Blob> {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const token = getTokenFromCookie();
  const res = await fetch(`${API_URL}/client/boletos/${nossoNumero}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Erro ao baixar PDF");
  return res.blob();
}

export async function getSegundaViaPreview(
  invoiceId: string
): Promise<SegundaViaPreview> {
  return api.get<SegundaViaPreview>(
    `/client/boletos/segunda-via/preview/${invoiceId}`
  );
}

export async function issueSegundaVia(
  invoiceId: string
): Promise<SegundaViaPreview> {
  return api.post<SegundaViaPreview>(
    `/client/boletos/segunda-via/issue/${invoiceId}`
  );
}

// ===================== Invoices =====================

export async function listPortalInvoices(
  status?: string
): Promise<PortalInvoice[]> {
  const params = status ? `?status=${status}` : "";
  return api.get<PortalInvoice[]>(`/client/invoices${params}`);
}

export async function getPortalInvoiceDetail(
  invoiceId: string
): Promise<PortalInvoice> {
  return api.get<PortalInvoice>(`/client/invoices/${invoiceId}`);
}

/** Redirects to Asaas payment URL (302) */
export function getInvoicePdfUrl(invoiceId: string): string {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${API_URL}/client/invoices/${invoiceId}/pdf`;
}

// ===================== Documents =====================

export async function listClientDocuments(
  params?: { document_type?: DocumentType; doc_status?: string }
): Promise<ClientDocument[]> {
  const query = new URLSearchParams();
  if (params?.document_type) query.set("document_type", params.document_type);
  if (params?.doc_status) query.set("doc_status", params.doc_status);
  const qs = query.toString();
  return api.get<ClientDocument[]>(`/client/documents${qs ? `?${qs}` : ""}`);
}

export async function uploadClientDocument(
  file: File,
  documentType: DocumentType,
  description?: string
): Promise<ClientDocument> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);
  if (description) formData.append("description", description);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const token = getTokenFromCookie();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/client/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Erro ${res.status}` }));
    throw new Error(typeof err.detail === "string" ? err.detail : `Erro ${res.status}`);
  }

  return res.json();
}

export async function getClientDocumentDetail(
  documentId: string
): Promise<ClientDocument> {
  return api.get<ClientDocument>(`/client/documents/${documentId}`);
}

/** Returns redirect URL for download */
export function getDocumentDownloadUrl(documentId: string): string {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${API_URL}/client/documents/${documentId}/download`;
}

export async function deleteClientDocument(
  documentId: string
): Promise<void> {
  await api.delete(`/client/documents/${documentId}`);
}

// ===================== Service Requests (Tickets) =====================

export async function createServiceRequest(
  data: ServiceRequestCreate
): Promise<ServiceRequest> {
  return api.post<ServiceRequest>("/client/service-requests", data);
}

export async function listServiceRequests(params?: {
  status?: string;
  service_type?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<ServiceRequest>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.service_type) query.set("service_type", params.service_type);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();
  return api.get<PaginatedResponse<ServiceRequest>>(
    `/client/service-requests${qs ? `?${qs}` : ""}`
  );
}

export async function getServiceRequestDetail(
  requestId: string
): Promise<ServiceRequestDetail> {
  return api.get<ServiceRequestDetail>(
    `/client/service-requests/${requestId}`
  );
}

export async function addServiceRequestMessage(
  requestId: string,
  message: string
): Promise<ServiceRequestMessage> {
  return api.post<ServiceRequestMessage>(
    `/client/service-requests/${requestId}/messages`,
    { message }
  );
}

// ===================== Service Orders =====================

export async function listServiceTypes(): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    base_price: string;
    is_active: boolean;
  }>
> {
  return api.get("/client/services/types");
}

export async function createServiceOrder(data: {
  service_type_id: string;
  notes?: string;
}): Promise<unknown> {
  return api.post("/client/services/orders", data);
}

export async function listServiceOrders(): Promise<unknown[]> {
  return api.get("/client/services/orders");
}

// ===================== Notifications =====================

export async function listNotifications(params?: {
  is_read?: boolean;
  notification_type?: string;
  page?: number;
  per_page?: number;
}): Promise<Notification[]> {
  const query = new URLSearchParams();
  if (params?.is_read !== undefined)
    query.set("is_read", String(params.is_read));
  if (params?.notification_type)
    query.set("notification_type", params.notification_type);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();
  return api.get<Notification[]>(
    `/client/notifications${qs ? `?${qs}` : ""}`
  );
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  return api.get<{ unread_count: number }>(
    "/client/notifications/unread-count"
  );
}

export async function markNotificationRead(
  notificationId: string
): Promise<Notification> {
  return api.patch<Notification>(
    `/client/notifications/${notificationId}/read`
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/client/notifications/read-all");
}

// ===================== Referrals =====================

export async function listReferrals(): Promise<PortalReferral[]> {
  return api.get<PortalReferral[]>("/client/referrals");
}

export async function createReferral(data: {
  referred_name: string;
  referred_phone: string;
  referred_email?: string;
}): Promise<PortalReferral> {
  return api.post<PortalReferral>("/client/referrals", data);
}

// ===================== Admin: Documents =====================

export async function adminListDocuments(params?: {
  client_id?: string;
  status?: string;
  document_type?: string;
}): Promise<ClientDocument[]> {
  const query = new URLSearchParams();
  if (params?.client_id) query.set("client_id", params.client_id);
  if (params?.status) query.set("status", params.status);
  if (params?.document_type) query.set("document_type", params.document_type);
  const qs = query.toString();
  return api.get<ClientDocument[]>(
    `/admin/documents${qs ? `?${qs}` : ""}`
  );
}

export async function adminGetPendingDocumentsCount(): Promise<{
  count: number;
}> {
  return api.get("/admin/documents/pending-count");
}

export async function adminGetDocumentDetail(
  documentId: string
): Promise<ClientDocument> {
  return api.get<ClientDocument>(`/admin/documents/${documentId}`);
}

export async function adminReviewDocument(
  documentId: string,
  data: { status: "APPROVED" | "REJECTED"; rejection_reason?: string }
): Promise<ClientDocument> {
  return api.patch<ClientDocument>(
    `/admin/documents/${documentId}/review`,
    data
  );
}

// ===================== Admin: Service Requests =====================

export async function adminListServiceRequests(params?: {
  client_id?: string;
  status?: string;
  service_type?: string;
  priority?: string;
}): Promise<PaginatedResponse<ServiceRequest>> {
  const query = new URLSearchParams();
  if (params?.client_id) query.set("client_id", params.client_id);
  if (params?.status) query.set("status", params.status);
  if (params?.service_type) query.set("service_type", params.service_type);
  if (params?.priority) query.set("priority", params.priority);
  const qs = query.toString();
  return api.get<PaginatedResponse<ServiceRequest>>(
    `/admin/service-requests${qs ? `?${qs}` : ""}`
  );
}

export async function adminGetServiceRequestStats(): Promise<
  Record<string, number>
> {
  return api.get("/admin/service-requests/stats");
}

export async function adminGetServiceRequestDetail(
  requestId: string
): Promise<ServiceRequestDetail> {
  return api.get<ServiceRequestDetail>(
    `/admin/service-requests/${requestId}`
  );
}

export async function adminUpdateServiceRequest(
  requestId: string,
  data: { status?: string; priority?: string; assigned_to?: string }
): Promise<ServiceRequest> {
  return api.patch<ServiceRequest>(
    `/admin/service-requests/${requestId}`,
    data
  );
}

export async function adminAddServiceRequestMessage(
  requestId: string,
  message: string,
  isInternal: boolean = false
): Promise<ServiceRequestMessage> {
  return api.post<ServiceRequestMessage>(
    `/admin/service-requests/${requestId}/messages?is_internal=${isInternal}`,
    { message }
  );
}

// ===================== Helpers =====================

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
