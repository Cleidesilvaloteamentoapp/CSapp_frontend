import { api } from "@/lib/api";
import type {
  EconomicIndexResponse,
  EconomicIndexCreate,
  EconomicIndexUpdate,
  CycleApprovalResponse,
  ContractTransferResponse,
  ContractTransferCreate,
  EarlyPayoffResponse,
  DefaulterDetail,
  ManualWriteoffRequest,
  CompanyFinancialSettingsResponse,
  CompanyFinancialSettingsUpdate,
  ClientLotResponse,
  ClientLotFinancialRulesUpdate,
  InstallmentInfo,
  GenerateNextBatchResponse,
  AdminNotification,
  RescissionResponse,
  SicrediEventResponse,
} from "@/types";
import type { Boleto } from "@/types/sicredi";
import type { ClientDocument } from "@/types/portal";

// ===================== Economic Indices =====================

export async function listEconomicIndices(params?: {
  index_type?: string;
  state_code?: string;
  start_month?: string;
  end_month?: string;
}): Promise<EconomicIndexResponse[]> {
  const query = new URLSearchParams();
  if (params?.index_type) query.set("index_type", params.index_type);
  if (params?.state_code) query.set("state_code", params.state_code);
  if (params?.start_month) query.set("start_month", params.start_month);
  if (params?.end_month) query.set("end_month", params.end_month);
  const qs = query.toString();
  return api.get<EconomicIndexResponse[]>(
    `/admin/economic-indices${qs ? `?${qs}` : ""}`
  );
}

export async function createEconomicIndex(
  data: EconomicIndexCreate
): Promise<EconomicIndexResponse> {
  return api.post<EconomicIndexResponse>("/admin/economic-indices", data);
}

export async function updateEconomicIndex(
  id: string,
  data: EconomicIndexUpdate
): Promise<EconomicIndexResponse> {
  return api.patch<EconomicIndexResponse>(
    `/admin/economic-indices/${id}`,
    data
  );
}

export async function deleteEconomicIndex(id: string): Promise<void> {
  await api.delete(`/admin/economic-indices/${id}`);
}

// ===================== Cycle Approvals =====================

export async function listCycleApprovals(params?: {
  status?: string;
}): Promise<CycleApprovalResponse[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return api.get<CycleApprovalResponse[]>(
    `/admin/cycle-approvals${qs ? `?${qs}` : ""}`
  );
}

export async function getCycleApprovalDetail(
  id: string
): Promise<CycleApprovalResponse> {
  return api.get<CycleApprovalResponse>(`/admin/cycle-approvals/${id}`);
}

export async function approveCycle(
  id: string,
  data: { new_installment_value: number; adjustment_details?: Record<string, unknown>; admin_notes?: string }
): Promise<CycleApprovalResponse> {
  return api.post<CycleApprovalResponse>(
    `/admin/cycle-approvals/${id}/approve`,
    data
  );
}

export async function rejectCycle(
  id: string,
  data: { admin_notes: string }
): Promise<CycleApprovalResponse> {
  return api.post<CycleApprovalResponse>(
    `/admin/cycle-approvals/${id}/reject`,
    data
  );
}

// ===================== Contract Transfers =====================

export async function listTransfers(params?: {
  status?: string;
}): Promise<ContractTransferResponse[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return api.get<ContractTransferResponse[]>(
    `/admin/transfers${qs ? `?${qs}` : ""}`
  );
}

export async function createTransfer(
  data: ContractTransferCreate
): Promise<ContractTransferResponse> {
  return api.post<ContractTransferResponse>("/admin/transfers", data);
}

export async function getTransferDetail(
  id: string
): Promise<ContractTransferResponse> {
  return api.get<ContractTransferResponse>(`/admin/transfers/${id}`);
}

export async function approveTransfer(
  id: string
): Promise<ContractTransferResponse> {
  return api.post<ContractTransferResponse>(
    `/admin/transfers/${id}/approve`
  );
}

export async function completeTransfer(
  id: string
): Promise<ContractTransferResponse> {
  return api.post<ContractTransferResponse>(
    `/admin/transfers/${id}/complete`
  );
}

export async function cancelTransfer(
  id: string
): Promise<ContractTransferResponse> {
  return api.post<ContractTransferResponse>(
    `/admin/transfers/${id}/cancel`
  );
}

// ===================== Rescissions (Distrato) =====================

export async function listRescissions(params?: {
  status?: string;
  client_id?: string;
}): Promise<RescissionResponse[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.client_id) query.set("client_id", params.client_id);
  const qs = query.toString();
  return api.get<RescissionResponse[]>(`/admin/rescissions${qs ? `?${qs}` : ""}`);
}

export async function getRescissionDetail(id: string): Promise<RescissionResponse> {
  return api.get<RescissionResponse>(`/admin/rescissions/${id}`);
}

export async function approveRescission(
  id: string,
  data: { approved: boolean; refund_amount?: number; penalty_amount?: number; admin_notes?: string }
): Promise<RescissionResponse> {
  return api.post<RescissionResponse>(`/admin/rescissions/${id}/approve`, data);
}

export async function completeRescission(id: string): Promise<RescissionResponse> {
  return api.post<RescissionResponse>(`/admin/rescissions/${id}/complete`);
}

export async function revertRescission(
  id: string,
  data?: { admin_notes?: string }
): Promise<RescissionResponse> {
  return api.post<RescissionResponse>(`/admin/rescissions/${id}/revert`, data ?? {});
}

// ===================== Sicredi Audit Events =====================

export async function listSicrediEvents(params?: {
  direction?: string;
  nosso_numero?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}): Promise<SicrediEventResponse[]> {
  const query = new URLSearchParams();
  if (params?.direction) query.set("direction", params.direction);
  if (params?.nosso_numero) query.set("nosso_numero", params.nosso_numero);
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return api.get<SicrediEventResponse[]>(`/admin/sicredi-events${qs ? `?${qs}` : ""}`);
}

// ===================== Early Payoff Requests (Admin) =====================

export async function listEarlyPayoffRequests(params?: {
  status?: string;
}): Promise<EarlyPayoffResponse[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return api.get<EarlyPayoffResponse[]>(
    `/admin/early-payoff-requests${qs ? `?${qs}` : ""}`
  );
}

export async function getEarlyPayoffDetail(
  id: string
): Promise<EarlyPayoffResponse> {
  return api.get<EarlyPayoffResponse>(`/admin/early-payoff-requests/${id}`);
}

export async function updateEarlyPayoffStatus(
  id: string,
  data: { status: string; admin_notes?: string }
): Promise<EarlyPayoffResponse> {
  return api.patch<EarlyPayoffResponse>(
    `/admin/early-payoff-requests/${id}`,
    data
  );
}

// ===================== Manual Boleto Writeoff =====================

export async function manualBoletoWriteoff(
  boletoId: string,
  data: ManualWriteoffRequest
): Promise<Boleto> {
  return api.post<Boleto>(`/admin/boletos/${boletoId}/baixa-manual`, data);
}

// ===================== Dashboard Defaulters =====================

export async function listDashboardDefaulters(): Promise<DefaulterDetail[]> {
  return api.get<DefaulterDetail[]>("/admin/dashboard/defaulters");
}

// ===================== Bank Statements (Stub) =====================

export async function uploadBankStatement(
  file: File
): Promise<{ message: string }> {
  return api.upload<{ message: string }>(
    "/admin/bank-statements/upload",
    file
  );
}

export async function getSupportedBanks(): Promise<
  Array<{ code: string; name: string }>
> {
  return api.get("/admin/bank-statements/supported-banks");
}

// ===================== Company Financial Settings =====================

export async function getFinancialSettings(): Promise<CompanyFinancialSettingsResponse> {
  return api.get<CompanyFinancialSettingsResponse>("/admin/financial-settings/");
}

export async function updateFinancialSettings(
  data: CompanyFinancialSettingsUpdate
): Promise<CompanyFinancialSettingsResponse> {
  return api.put<CompanyFinancialSettingsResponse>("/admin/financial-settings/", data);
}

// ===================== Client-Lot Financial Rules =====================

export async function getClientLotDetail(
  clientLotId: string
): Promise<ClientLotResponse> {
  return api.get<ClientLotResponse>(`/admin/lots/client-lots/${clientLotId}`);
}

export async function updateClientLotFinancialRules(
  clientLotId: string,
  data: ClientLotFinancialRulesUpdate
): Promise<ClientLotResponse> {
  return api.patch<ClientLotResponse>(
    `/admin/lots/client-lots/${clientLotId}/financial-rules`,
    data
  );
}

// ===================== Installment Management (12x12 Cycle) =====================

export async function getInstallmentInfo(
  clientLotId: string
): Promise<InstallmentInfo> {
  return api.get<InstallmentInfo>(`/admin/lots/client-lots/${clientLotId}/installments`);
}

export async function generateNextBatch(
  clientLotId: string,
  adjustmentRate: number
): Promise<GenerateNextBatchResponse> {
  const query = new URLSearchParams();
  query.set("adjustment_rate", String(adjustmentRate));
  return api.post<GenerateNextBatchResponse>(
    `/admin/lots/client-lots/${clientLotId}/generate-next-batch?${query.toString()}`,
    null
  );
}

// ===================== Admin Notifications =====================

export async function listAdminNotifications(params?: {
  is_read?: boolean;
  notification_type?: string;
  page?: number;
  per_page?: number;
}): Promise<AdminNotification[]> {
  const query = new URLSearchParams();
  if (params?.is_read !== undefined)
    query.set("is_read", String(params.is_read));
  if (params?.notification_type)
    query.set("notification_type", params.notification_type);
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const qs = query.toString();
  return api.get<AdminNotification[]>(
    `/admin/notifications${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminUnreadCount(): Promise<{ unread_count: number }> {
  return api.get<{ unread_count: number }>("/admin/notifications/unread-count");
}

export async function markAdminNotificationRead(
  notificationId: string
): Promise<AdminNotification> {
  return api.patch<AdminNotification>(
    `/admin/notifications/${notificationId}/read`
  );
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await api.patch("/admin/notifications/read-all");
}

// ===================== Client Documents =====================

export async function getClientDocuments(clientId: string): Promise<ClientDocument[]> {
  return api.get<ClientDocument[]>(`/admin/clients/${clientId}/documents`);
}
