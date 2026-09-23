/**
 * Shared option lists and helpers for the boleto juros/multa selectors.
 *
 * These literals used to be hardcoded inline in every screen that creates
 * boletos and only `as`-cast, never checked against the union — which is how
 * the UI came to send `PERCENTUAL_MES` while Sicredi only understands
 * `PERCENTUAL`, silently failing every boleto that carried juros. Keeping one
 * typed list means a value can no longer drift per screen.
 */

import type { TipoDesconto, TipoJuros, TipoMulta } from "@/types/sicredi";

/** Sicredi registers juros per month; contracts state them per day. */
export const DAYS_PER_MONTH = 30;

export const JUROS_OPTIONS: { value: TipoJuros; label: string }[] = [
  { value: "ISENTO", label: "Isento" },
  { value: "PERCENTUAL_DIA", label: "% ao Dia" },
  { value: "PERCENTUAL_MES", label: "% ao Mês" },
  { value: "VALOR_DIA", label: "Valor por Dia" },
];

export const MULTA_OPTIONS: { value: TipoMulta; label: string }[] = [
  { value: "ISENTO", label: "Isento" },
  { value: "PERCENTUAL", label: "Percentual" },
  { value: "VALOR", label: "Valor Fixo" },
];

export const DESCONTO_OPTIONS: { value: TipoDesconto; label: string }[] = [
  { value: "ISENTO", label: "Isento" },
  { value: "VALOR", label: "Valor Fixo" },
  { value: "PERCENTUAL", label: "Percentual" },
];

/** Label for the amount field, which changes meaning with the selected type. */
export function jurosAmountLabel(tipo: TipoJuros): string {
  switch (tipo) {
    case "VALOR_DIA":
      return "Valor/Dia (R$)";
    case "PERCENTUAL_DIA":
      return "% ao Dia";
    default:
      return "% ao Mês";
  }
}

/**
 * What the bank will actually register, shown under the amount field.
 *
 * Sicredi stores juros as a monthly percentage, so a contract's "0,33% ao dia"
 * is registered as 9,90% ao mês. Showing the derived value keeps the operator
 * from having to trust an invisible conversion.
 */
export function jurosMonthlyEquivalent(
  tipo: TipoJuros,
  valor: string | number | undefined | null,
): string | null {
  if (tipo !== "PERCENTUAL_DIA") return null;
  const n = typeof valor === "number" ? valor : parseFloat(String(valor ?? ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const monthly = (n * DAYS_PER_MONTH).toFixed(2).replace(".", ",");
  return `Equivale a ${monthly}% ao mês — é assim que o Sicredi registra.`;
}

/**
 * Guard against the "boleto saiu isento sem ninguém perceber" failure: a type
 * other than ISENTO with a blank or zero amount used to be dropped from the
 * payload silently. Returns an error message, or null when the pair is valid.
 */
export function validateFeePair(
  label: string,
  tipo: TipoJuros | TipoMulta | TipoDesconto,
  valor: string | number | undefined | null,
): string | null {
  if (tipo === "ISENTO") return null;
  const n = typeof valor === "number" ? valor : parseFloat(String(valor ?? ""));
  if (!Number.isFinite(n) || n <= 0) {
    return `Informe o valor de ${label} ou selecione "Isento".`;
  }
  return null;
}
