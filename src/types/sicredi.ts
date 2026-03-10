// ===================== Sicredi Credentials =====================
export interface SicrediCredentialsRequest {
  x_api_key: string;
  username: string;
  password: string;
  cooperativa: string;
  posto: string;
  codigo_beneficiario: string;
  environment: "sandbox" | "production";
}

export interface SicrediCredentialsResponse {
  id: string;
  company_id: string;
  cooperativa: string;
  posto: string;
  codigo_beneficiario: string;
  environment: "sandbox" | "production";
  is_active: boolean;
  has_valid_token: boolean;
  webhook_contract_id: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Pagador =====================
export type TipoPessoa = "PESSOA_FISICA" | "PESSOA_JURIDICA";

export interface Pagador {
  tipo_pessoa: TipoPessoa;
  documento: string;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
}

// ===================== Boleto =====================
export type TipoCobranca = "NORMAL" | "HIBRIDO";

export type EspecieDocumento =
  | "DUPLICATA_MERCANTIL_INDICACAO"
  | "DUPLICATA_RURAL"
  | "NOTA_PROMISSORIA"
  | "NOTA_PROMISSORIA_RURAL"
  | "NOTA_SEGUROS"
  | "RECIBO"
  | "LETRA_CAMBIO"
  | "NOTA_DEBITO"
  | "DUPLICATA_SERVICO_INDICACAO"
  | "OUTROS";

export type TipoDesconto = "VALOR" | "PERCENTUAL" | "ISENTO";
export type TipoJuros = "VALOR_DIA" | "PERCENTUAL_MES" | "ISENTO";
export type TipoMulta = "VALOR" | "PERCENTUAL" | "ISENTO";

export interface CreateBoletoRequest {
  client_id: string;
  tipo_cobranca: TipoCobranca;
  pagador: Pagador;
  especie_documento: EspecieDocumento;
  data_vencimento: string; // YYYY-MM-DD
  valor: number;
  seu_numero: string;
  invoice_id?: string;
  dias_negativacao_auto?: number;
  tipo_desconto?: TipoDesconto;
  valor_desconto_1?: number;
  data_desconto_1?: string;
  valor_desconto_2?: number;
  data_desconto_2?: string;
  valor_desconto_3?: number;
  data_desconto_3?: string;
  tipo_juros?: TipoJuros;
  juros?: number;
  tipo_multa?: TipoMulta;
  multa?: number;
  informativos?: string[];
  mensagens?: string[];
}

export interface BoletoCreated {
  boleto_id: string;
  client_id: string;
  linha_digitavel: string;
  codigo_barras: string;
  nosso_numero: string;
  txid?: string;
  qr_code?: string;
}

export type BoletoSituacao =
  | "NORMAL"
  | "LIQUIDADO"
  | "VENCIDO"
  | "CANCELADO"
  | "NEGATIVADO"
  | "EM_ABERTO";

// ===================== Boleto Details (Sicredi API response) =====================
export interface BoletoDetails {
  nosso_numero: string;
  codigo_barras: string;
  linha_digitavel: string;
  situacao: BoletoSituacao;
  data_vencimento: string;
  valor: number;
  pagador: {
    tipoPessoa: TipoPessoa;
    documento: string;
    nome: string;
  };
  tipo_cobranca: TipoCobranca;
  txid: string | null;
  qr_code: string | null;
  seu_numero: string;
  raw_data?: Record<string, unknown>;
}

// ===================== Boleto Local (banco de dados com cliente) =====================
export interface BoletoClient {
  id: string;
  full_name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
}

export interface Boleto {
  id: string;
  client_id?: string | null;
  client?: BoletoClient | null;
  nosso_numero: string;
  linha_digitavel: string;
  codigo_barras: string;
  txid?: string | null;
  qr_code?: string | null;
  tipo_cobranca: TipoCobranca;
  especie_documento?: EspecieDocumento | null;
  valor: number | string;
  data_vencimento: string;
  data_emissao?: string | null;
  data_liquidacao?: string | null;
  valor_liquidacao?: number | string | null;
  status: BoletoSituacao;
  seu_numero: string;
  pagador_nome?: string;
  pagador_documento?: string;
  invoice_id?: string | null;
  dias_negativacao_auto?: number | null;
  created_at: string;
  updated_at: string;
}

// ===================== Boleto Stats (Dashboard) =====================
export interface BoletoStatusCount {
  status: BoletoSituacao;
  count: number;
  total_value: number;
}

export interface BoletoStats {
  total: number;
  total_value: number;
  by_status: BoletoStatusCount[];
}

// ===================== Boleto List Filters =====================
export interface BoletoListFilters {
  client_id?: string;
  status?: BoletoSituacao;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// ===================== Instruções (edição de boleto) =====================
export interface AlterarVencimentoRequest {
  data_vencimento: string; // YYYY-MM-DD
}

export interface AlterarDescontoRequest {
  valor_desconto_1?: number | null;
  valor_desconto_2?: number | null;
  valor_desconto_3?: number | null;
}

export interface AlterarJurosRequest {
  valor_ou_percentual: string;
}

export interface ConcederAbatimentoRequest {
  valor_abatimento: number;
}

export interface AlterarSeuNumeroRequest {
  seu_numero: string;
}

export interface NegativacaoRequest {
  dias_negativacao?: number;
}

export interface InstrucaoResponse {
  status: string;
  detail: string;
  response?: Record<string, unknown>;
}

// ===================== Batch =====================
export type BatchFrequency = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export type BatchAction =
  | "BAIXA"
  | "ALTERAR_VENCIMENTO"
  | "ALTERAR_JUROS"
  | "ALTERAR_DESCONTO"
  | "CONCEDER_ABATIMENTO"
  | "CANCELAR_ABATIMENTO"
  | "NEGATIVACAO"
  | "SUSTAR_NEGATIVACAO_BAIXAR";

export type BatchStatusType = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface BatchCreateRequest {
  client_id: string;
  pagador: Pagador;
  valor: number;
  frequency: BatchFrequency;
  duration_months: number;
  data_primeiro_vencimento: string; // YYYY-MM-DD
  tipo_juros?: TipoJuros;
  juros?: number;
  tipo_multa?: TipoMulta;
  multa?: number;
  dias_negativacao_auto?: number;
}

export interface BatchCreateResponse {
  batch_id: string;
  type: string;
  status: BatchStatusType;
  total_items: number;
  message: string;
}

export interface BatchOperationRequest {
  nosso_numeros: string[];
  action: BatchAction;
  data_vencimento?: string;
  valor_ou_percentual?: string;
  valor_abatimento?: number;
}

export interface BatchOperationResponse {
  batch_id: string;
  type: string;
  status: BatchStatusType;
  total_items: number;
  message: string;
}

export interface BatchItemResult {
  nosso_numero: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  error?: string;
}

export interface BatchProgress {
  id: string;
  type: string;
  status: BatchStatusType;
  total_items: number;
  completed_items: number;
  failed_items: number;
  results: BatchItemResult[];
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

// ===================== Segunda Via =====================
export interface SegundaViaPreview {
  invoice_id: string;
  original_due_date: string;
  new_due_date: string;
  original_value: number;
  corrected_value: number;
  juros_aplicado: number;
  multa_aplicada: number;
  dias_atraso: number;
}

export interface SegundaViaIssueRequest {
  invoice_id: string;
  new_due_date: string;
}

export interface SegundaViaIssueResponse {
  boleto_id: string;
  nosso_numero: string;
  linha_digitavel: string;
  codigo_barras: string;
  valor: number;
  data_vencimento: string;
}

// ===================== Boleto Armazenado (compat legado) =====================
export interface BoletoStoredResponse {
  id: string;
  company_id: string;
  client_id: string;
  nosso_numero: string;
  linha_digitavel: string;
  codigo_barras: string;
  txid: string | null;
  qr_code: string | null;
  tipo_cobranca: TipoCobranca;
  valor: number;
  data_vencimento: string;
  situacao: BoletoSituacao;
  seu_numero: string;
  pagador_nome: string;
  pagador_documento: string;
  created_at: string;
  updated_at: string;
}

// ===================== Status Helpers =====================
export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  NORMAL: { label: "Em Aberto", variant: "outline", color: "text-green-600" },
  EM_ABERTO: { label: "Em Aberto", variant: "outline", color: "text-green-600" },
  LIQUIDADO: { label: "Liquidado", variant: "default", color: "text-blue-600" },
  VENCIDO: { label: "Vencido", variant: "destructive", color: "text-yellow-600" },
  CANCELADO: { label: "Cancelado", variant: "secondary", color: "text-gray-500" },
  NEGATIVADO: { label: "Negativado", variant: "destructive", color: "text-red-600" },
};

export const ACTIONS_BY_STATUS: Record<string, BatchAction[]> = {
  NORMAL: ["BAIXA", "ALTERAR_VENCIMENTO", "ALTERAR_JUROS", "ALTERAR_DESCONTO", "CONCEDER_ABATIMENTO", "CANCELAR_ABATIMENTO"],
  VENCIDO: ["BAIXA", "NEGATIVACAO", "ALTERAR_VENCIMENTO", "ALTERAR_JUROS", "CONCEDER_ABATIMENTO"],
  NEGATIVADO: ["SUSTAR_NEGATIVACAO_BAIXAR"],
  LIQUIDADO: [],
  CANCELADO: [],
};

export const BATCH_ACTION_LABELS: Record<BatchAction, string> = {
  BAIXA: "Dar Baixa (Cancelar)",
  ALTERAR_VENCIMENTO: "Alterar Vencimento",
  ALTERAR_JUROS: "Alterar Juros",
  ALTERAR_DESCONTO: "Alterar Desconto",
  CONCEDER_ABATIMENTO: "Conceder Abatimento",
  CANCELAR_ABATIMENTO: "Cancelar Abatimento",
  NEGATIVACAO: "Incluir Negativação",
  SUSTAR_NEGATIVACAO_BAIXAR: "Sustar Negativação + Baixar",
};

export const FREQ_MONTHS: Record<BatchFrequency, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};
