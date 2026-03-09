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
  client_id: string; // UUID do cliente - vínculo obrigatório
  tipo_cobranca: TipoCobranca;
  pagador: Pagador;
  especie_documento: EspecieDocumento;
  data_vencimento: string; // YYYY-MM-DD
  valor: number;
  seu_numero: string;
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
  | "EM_ABERTO";

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

export interface InstrucaoResponse {
  status: string;
  detail: string;
  response?: Record<string, unknown>;
}

// ===================== Boleto Armazenado (com vínculo ao cliente) =====================
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
