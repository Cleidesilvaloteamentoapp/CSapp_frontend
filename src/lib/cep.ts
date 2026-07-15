/**
 * Busca de endereço por CEP.
 *
 * Usa a BrasilAPI (https://brasilapi.com.br) como fonte primária — ela já
 * agrega múltiplos provedores (Correios, ViaCEP, WideNet) do lado do servidor,
 * de forma parecida com o cep-promise, porém sem custo de bundle. Caso a
 * BrasilAPI falhe, cai automaticamente para o ViaCEP.
 */

export interface CepAddress {
  cep: string;
  state: string; // UF, ex.: "SP"
  city: string;
  neighborhood: string;
  street: string;
}

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/** Aplica a máscara de CEP (00000-000) enquanto o usuário digita. */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Um CEP é válido para busca quando possui exatamente 8 dígitos. */
export function isValidCep(value: string): boolean {
  return onlyDigits(value).length === 8;
}

/** Erro de negócio (CEP não encontrado / inválido), distinto de erro de rede. */
export class CepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CepError";
  }
}

interface BrasilApiCep {
  cep: string;
  state: string;
  city: string;
  neighborhood: string | null;
  street: string | null;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

async function fromBrasilApi(cep: string, signal?: AbortSignal): Promise<CepAddress> {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal });
  if (!res.ok) throw new CepError("CEP não encontrado");
  const data = (await res.json()) as BrasilApiCep;
  return {
    cep: data.cep ?? cep,
    state: data.state ?? "",
    city: data.city ?? "",
    neighborhood: data.neighborhood ?? "",
    street: data.street ?? "",
  };
}

async function fromViaCep(cep: string, signal?: AbortSignal): Promise<CepAddress> {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!res.ok) throw new CepError("CEP não encontrado");
  const data = (await res.json()) as ViaCepResponse;
  if (data.erro) throw new CepError("CEP não encontrado");
  return {
    cep: data.cep ?? cep,
    state: data.uf ?? "",
    city: data.localidade ?? "",
    neighborhood: data.bairro ?? "",
    street: data.logradouro ?? "",
  };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/**
 * Busca o endereço de um CEP. Tenta a BrasilAPI e, em caso de falha de rede,
 * usa o ViaCEP como fallback. Lança `CepError` quando o CEP não existe.
 */
export async function fetchAddressByCep(
  cep: string,
  signal?: AbortSignal
): Promise<CepAddress> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) throw new CepError("CEP deve ter 8 dígitos");

  try {
    return await fromBrasilApi(digits, signal);
  } catch (err) {
    if (isAbortError(err)) throw err;
    // Fallback: só faz sentido tentar o ViaCEP se não for um abort.
    return await fromViaCep(digits, signal);
  }
}
