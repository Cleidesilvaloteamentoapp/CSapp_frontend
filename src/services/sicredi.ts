import { api } from "@/lib/api";
import type {
  SicrediCredentialsRequest,
  SicrediCredentialsResponse,
  CreateBoletoRequest,
  BoletoCreated,
  BoletoDetails,
  AlterarVencimentoRequest,
  AlterarDescontoRequest,
  AlterarJurosRequest,
  ConcederAbatimentoRequest,
  InstrucaoResponse,
} from "@/types/sicredi";

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
