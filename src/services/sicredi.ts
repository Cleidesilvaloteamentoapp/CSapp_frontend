import { api } from "@/lib/api";
import type {
  SicrediCredentialsRequest,
  SicrediCredentialsResponse,
  CreateBoletoRequest,
  BoletoCreated,
  BoletoDetails,
  BoletoStoredResponse,
  Boleto,
  BoletoStats,
  BoletoListFilters,
  AlterarVencimentoRequest,
  AlterarDescontoRequest,
  AlterarJurosRequest,
  AlterarSeuNumeroRequest,
  ConcederAbatimentoRequest,
  NegativacaoRequest,
  InstrucaoResponse,
  BatchCreateRequest,
  BatchCreateResponse,
  BatchOperationRequest,
  BatchOperationResponse,
  BatchProgress,
  SegundaViaPreview,
  SegundaViaIssueRequest,
  SegundaViaIssueResponse,
} from "@/types/sicredi";
import type { PaginatedResponse } from "@/types";

// ===================== Credenciais (Admin) =====================

export async function getCredentials(): Promise<SicrediCredentialsResponse> {
  return api.get<SicrediCredentialsResponse>("/admin/sicredi/credentials");
}

export async function saveCredentials(
  data: SicrediCredentialsRequest
): Promise<SicrediCredentialsResponse> {
  return api.post<SicrediCredentialsResponse>(
    "/admin/sicredi/credentials",
    data
  );
}

// ===================== Boletos (Admin) =====================

export async function createBoleto(
  data: CreateBoletoRequest
): Promise<BoletoCreated> {
  return api.post<BoletoCreated>("/admin/sicredi/boletos", data);
}

export async function getBoleto(nossoNumero: string): Promise<BoletoDetails> {
  return api.get<BoletoDetails>(`/admin/sicredi/boletos/${nossoNumero}`);
}

export async function getBoletoBySeuNumero(
  seuNumero: string
): Promise<BoletoDetails[]> {
  return api.get<BoletoDetails[]>(
    `/admin/sicredi/boletos/busca/seu-numero/${seuNumero}`
  );
}

export async function getBoletosLiquidados(
  dia: string
): Promise<BoletoDetails[]> {
  return api.get<BoletoDetails[]>(
    `/admin/sicredi/boletos/liquidados/${dia}`
  );
}

export async function downloadBoletoPdf(
  linhaDigitavel: string
): Promise<Blob> {
  const token = getTokenFromCookies();
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const response = await fetch(
    `${API_URL}/admin/sicredi/boletos/pdf/${linhaDigitavel}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao gerar PDF");
  }

  return response.blob();
}

export async function cancelBoleto(
  nossoNumero: string
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/baixa`
  );
}

export async function alterarVencimento(
  nossoNumero: string,
  data: AlterarVencimentoRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/data-vencimento`,
    data
  );
}

export async function alterarDesconto(
  nossoNumero: string,
  data: AlterarDescontoRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/desconto`,
    data
  );
}

export async function alterarJuros(
  nossoNumero: string,
  data: AlterarJurosRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/juros`,
    data
  );
}

export async function concederAbatimento(
  nossoNumero: string,
  data: ConcederAbatimentoRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/conceder-abatimento`,
    data
  );
}

export async function cancelarAbatimento(
  nossoNumero: string
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/cancelar-abatimento`
  );
}

// ===================== CRUD Local (Admin — /admin/boletos) =====================

export async function listLocalBoletos(
  filters?: BoletoListFilters
): Promise<Boleto[] | PaginatedResponse<Boleto>> {
  const params = new URLSearchParams();
  if (filters?.client_id) params.set("client_id", filters.client_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.data_inicio) params.set("data_inicio", filters.data_inicio);
  if (filters?.data_fim) params.set("data_fim", filters.data_fim);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.per_page) params.set("per_page", String(filters.per_page));

  const query = params.toString();
  return api.get<Boleto[] | PaginatedResponse<Boleto>>(
    `/admin/boletos${query ? `?${query}` : ""}`
  );
}

export async function getBoletoStats(): Promise<BoletoStats> {
  return api.get<BoletoStats>("/admin/boletos/stats");
}

export async function getBoletoById(id: string): Promise<Boleto> {
  return api.get<Boleto>(`/admin/boletos/id/${id}`);
}

export async function getBoletoByNossoNumero(
  nossoNumero: string
): Promise<Boleto> {
  return api.get<Boleto>(`/admin/boletos/nosso-numero/${nossoNumero}`);
}

export async function getClientBoletos(
  clientId: string,
  status?: string
): Promise<Boleto[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  return api.get<Boleto[]>(
    `/admin/boletos/client/${clientId}${query ? `?${query}` : ""}`
  );
}

export async function updateBoleto(
  id: string,
  data: Partial<Pick<Boleto, "client_id" | "status" | "invoice_id">>
): Promise<Boleto> {
  return api.patch<Boleto>(`/admin/boletos/${id}`, data);
}

export async function deleteBoleto(id: string): Promise<void> {
  return api.delete(`/admin/boletos/${id}`);
}

// ===================== Sicredi API — Novas Instruções =====================

export async function alterarSeuNumero(
  nossoNumero: string,
  data: AlterarSeuNumeroRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/seu-numero`,
    data
  );
}

export async function incluirNegativacao(
  nossoNumero: string,
  data?: NegativacaoRequest
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/negativacao`,
    data
  );
}

export async function sustarNegativacaoBaixar(
  nossoNumero: string
): Promise<InstrucaoResponse> {
  return api.patch<InstrucaoResponse>(
    `/admin/sicredi/boletos/${nossoNumero}/sustar-negativacao-baixar-titulo`
  );
}

// ===================== Batch (Admin) =====================

export async function createBatchBoletos(
  data: BatchCreateRequest
): Promise<BatchCreateResponse> {
  return api.post<BatchCreateResponse>(
    "/admin/sicredi/boletos/batch",
    data
  );
}

export async function executeBatchOperation(
  data: BatchOperationRequest
): Promise<BatchOperationResponse> {
  return api.post<BatchOperationResponse>(
    "/admin/sicredi/boletos/batch-operation",
    data
  );
}

export async function getBatchProgress(
  batchId: string
): Promise<BatchProgress> {
  return api.get<BatchProgress>(
    `/admin/sicredi/boletos/batch/${batchId}`
  );
}

// ===================== Segunda Via (Admin) =====================

export async function getSegundaViaPreview(
  invoiceId: string
): Promise<SegundaViaPreview> {
  return api.get<SegundaViaPreview>(
    `/admin/segunda-via/preview/${invoiceId}`
  );
}

export async function issueSegundaVia(
  data: SegundaViaIssueRequest
): Promise<SegundaViaIssueResponse> {
  return api.post<SegundaViaIssueResponse>(
    "/admin/segunda-via/issue",
    data
  );
}

// ===================== Boletos (Client) =====================

export async function getClientBoleto(
  nossoNumero: string
): Promise<BoletoDetails> {
  return api.get<BoletoDetails>(`/client/boletos/${nossoNumero}`);
}

export async function downloadClientBoletoPdf(
  nossoNumero: string
): Promise<Blob> {
  const token = getTokenFromCookies();
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const response = await fetch(
    `${API_URL}/client/boletos/${nossoNumero}/pdf`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao gerar PDF");
  }

  return response.blob();
}

// ===================== Helpers =====================

function getTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function triggerPdfDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
