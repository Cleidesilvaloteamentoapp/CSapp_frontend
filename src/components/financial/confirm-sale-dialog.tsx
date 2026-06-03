"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchPlanPreview, type PlanPreview, type PlanPreviewRequest } from "@/lib/pricing";

const INDEX_LABELS: Record<string, string> = {
  IPCA: "IPCA", IGPM: "IGP-M", CUB: "CUB", INPC: "INPC",
};
const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "Mensal", QUARTERLY: "Trimestral", SEMIANNUAL: "Semestral", ANNUAL: "Anual",
};

/** Rate overrides the admin may set on the confirmation step (percent values). */
export interface RateOverrides {
  penalty_rate?: number;
  daily_interest_rate?: number;
  adjustment_index?: string;
  adjustment_frequency?: string;
  adjustment_custom_rate?: number;
}

interface ConfirmSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Values from the sale form used to build the dry-run preview. */
  request: PlanPreviewRequest | null;
  submitting?: boolean;
  /** Called when the admin confirms; receives any rate edits made here. */
  onConfirm: (overrides: RateOverrides) => void | Promise<void>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

export function ConfirmSaleDialog({
  open, onOpenChange, request, submitting, onConfirm,
}: ConfirmSaleDialogProps) {
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRates, setEditingRates] = useState(false);
  const [rates, setRates] = useState<RateOverrides>({});

  useEffect(() => {
    if (!open || !request) return;
    setLoading(true);
    setError(null);
    setEditingRates(false);
    fetchPlanPreview(request)
      .then((p) => {
        setPreview(p);
        // Seed editable rates from the effective (resolved) values.
        setRates({
          penalty_rate: Number(p.effective_rates.penalty_rate),
          daily_interest_rate: Number(p.effective_rates.daily_interest_rate),
          adjustment_index: p.effective_rates.adjustment_index,
          adjustment_frequency: p.effective_rates.adjustment_frequency,
          adjustment_custom_rate: Number(p.effective_rates.adjustment_custom_rate),
        });
      })
      .catch((e) => setError(e?.message ?? "Erro ao calcular o plano"))
      .finally(() => setLoading(false));
  }, [open, request]);

  const setRate = (k: keyof RateOverrides, v: number | string | undefined) =>
    setRates((prev) => ({ ...prev, [k]: v }));

  async function handleConfirm() {
    // Only forward rates the admin actually changed from the effective values.
    const overrides: RateOverrides = {};
    if (preview) {
      const e = preview.effective_rates;
      if (rates.penalty_rate !== Number(e.penalty_rate)) overrides.penalty_rate = rates.penalty_rate;
      if (rates.daily_interest_rate !== Number(e.daily_interest_rate)) overrides.daily_interest_rate = rates.daily_interest_rate;
      if (rates.adjustment_index !== e.adjustment_index) overrides.adjustment_index = rates.adjustment_index;
      if (rates.adjustment_frequency !== e.adjustment_frequency) overrides.adjustment_frequency = rates.adjustment_frequency;
      if (rates.adjustment_custom_rate !== Number(e.adjustment_custom_rate)) overrides.adjustment_custom_rate = rates.adjustment_custom_rate;
    }
    await onConfirm(overrides);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar venda</DialogTitle>
          <DialogDescription>
            Revise os valores e as taxas aplicadas antes de gerar o contrato e as parcelas.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculando plano...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {preview && !loading && !error && (
          <div className="space-y-4">
            {/* Critical plan values */}
            <div className="rounded-lg border p-3">
              <Row label="Valor total" value={formatCurrency(preview.total_value)} />
              <Row label="Entrada" value={formatCurrency(preview.down_payment)} />
              <Row label="Valor financiado" value={formatCurrency(preview.financed_value)} strong />
              <Row label="Nº de parcelas" value={String(preview.installments)} strong />
              <Row label="Valor mensal" value={formatCurrency(preview.monthly_value)} strong />
              {preview.has_residue && (
                <Row label="Última parcela (ajuste)" value={formatCurrency(preview.last_installment_value)} />
              )}
              {preview.first_due && (
                <Row label="Primeiro vencimento" value={formatDate(preview.first_due)} />
              )}
            </div>

            {/* Effective rates — always shown, editable */}
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">Taxas aplicadas</h4>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setEditingRates((v) => !v)}
                >
                  <Pencil className="h-3 w-3" /> {editingRates ? "Fechar" : "Alterar"}
                </Button>
              </div>

              {!editingRates ? (
                <>
                  <Row label="Multa" value={`${preview.effective_rates.penalty_rate}%`} />
                  <Row label="Juros/dia" value={`${preview.effective_rates.daily_interest_rate}%/dia`} />
                  <Row label="Índice de reajuste" value={INDEX_LABELS[rates.adjustment_index ?? ""] ?? rates.adjustment_index ?? "—"} />
                  <Row label="Frequência" value={FREQ_LABELS[rates.adjustment_frequency ?? ""] ?? rates.adjustment_frequency ?? "—"} />
                  <Row label="Taxa fixa" value={`${preview.effective_rates.adjustment_custom_rate}%`} />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Multa (%)</Label>
                    <Input type="number" step="0.1" value={rates.penalty_rate ?? ""}
                      onChange={(e) => setRate("penalty_rate", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <Label className="text-xs">Juros/dia (%)</Label>
                    <Input type="number" step="0.001" value={rates.daily_interest_rate ?? ""}
                      onChange={(e) => setRate("daily_interest_rate", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <Label className="text-xs">Índice</Label>
                    <Select value={rates.adjustment_index} onValueChange={(v) => setRate("adjustment_index", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(INDEX_LABELS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Frequência</Label>
                    <Select value={rates.adjustment_frequency} onValueChange={(v) => setRate("adjustment_frequency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQ_LABELS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Taxa fixa (%)</Label>
                    <Input type="number" step="0.1" value={rates.adjustment_custom_rate ?? ""}
                      onChange={(e) => setRate("adjustment_custom_rate", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <p className="text-xs text-yellow-800">
                <strong>Atenção:</strong> confirmar irá gerar o contrato e as parcelas com os valores
                acima. As taxas aplicadas seguem para a geração dos boletos.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || loading || !!error || !preview}
            className="bg-success hover:bg-success/90"
          >
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</>) : "Confirmar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
