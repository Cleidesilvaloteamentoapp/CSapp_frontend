import { api } from "@/lib/api";

/**
 * Bidirectional payment-plan computation. Mirrors the backend
 * `pricing_service.compute_plan` for instant UI feedback; the backend remains
 * the authoritative source via `fetchPlanPreview`.
 *
 * Rules:
 *   total + entrada + parcelas -> mensal = (total - entrada) / parcelas
 *   total + entrada + mensal   -> parcelas = round((total - entrada) / mensal)
 *
 * The last installment absorbs the rounding residue so the sum equals the
 * financed amount exactly.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface LocalPlan {
  totalValue: number;
  downPayment: number;
  financedValue: number;
  installments: number;
  monthlyValue: number;
  lastInstallmentValue: number;
  hasResidue: boolean;
  error?: string;
}

export function computePlanLocal(params: {
  totalValue?: number;
  downPayment?: number;
  installments?: number;
  monthlyValue?: number;
}): LocalPlan | null {
  const total = params.totalValue ?? 0;
  const down = params.downPayment ?? 0;

  if (!total || total <= 0) return null;
  if (down < 0 || down > total) {
    return {
      totalValue: total, downPayment: down, financedValue: 0,
      installments: 0, monthlyValue: 0, lastInstallmentValue: 0,
      hasResidue: false, error: "Entrada inválida",
    };
  }

  const financed = round2(total - down);
  let n: number;
  let base: number;

  if (params.installments && params.installments > 0) {
    n = Math.trunc(params.installments);
    base = round2(financed / n);
  } else if (params.monthlyValue && params.monthlyValue > 0) {
    if (params.monthlyValue > financed) {
      n = 1;
      base = financed;
    } else {
      n = Math.max(1, Math.round(financed / params.monthlyValue));
      base = round2(params.monthlyValue);
    }
  } else {
    return null; // not enough info yet
  }

  if (financed === 0) {
    return {
      totalValue: total, downPayment: down, financedValue: 0,
      installments: 0, monthlyValue: 0, lastInstallmentValue: 0, hasResidue: false,
    };
  }

  const last = round2(financed - base * (n - 1));
  return {
    totalValue: total,
    downPayment: down,
    financedValue: financed,
    installments: n,
    monthlyValue: base,
    lastInstallmentValue: last,
    hasResidue: last !== base,
  };
}

// ---------------------------------------------------------------------------
// Authoritative preview from the backend (includes effective rates)
// ---------------------------------------------------------------------------

export interface EffectiveRates {
  penalty_rate: number;
  daily_interest_rate: number;
  adjustment_index: string;
  adjustment_frequency: string;
  adjustment_custom_rate: number;
}

export interface PlanPreview {
  total_value: string;
  down_payment: string;
  financed_value: string;
  installments: number;
  monthly_value: string;
  last_installment_value: string;
  has_residue: boolean;
  first_due: string | null;
  effective_rates: EffectiveRates;
}

export interface PlanPreviewRequest {
  total_value: number;
  down_payment?: number;
  total_installments?: number;
  monthly_value?: number;
  purchase_date?: string;
  first_due?: string;
  penalty_rate?: number;
  daily_interest_rate?: number;
  adjustment_index?: string;
  adjustment_frequency?: string;
  adjustment_custom_rate?: number;
}

export function fetchPlanPreview(payload: PlanPreviewRequest): Promise<PlanPreview> {
  return api.post<PlanPreview>("/admin/lots/assign/preview", payload);
}
