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
} from "@/types";
import type { Boleto } from "@/types/sicredi";

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
