"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { approveCycle, forceApproveCycle } from "@/services/admin";
import type { CycleApprovalResponse } from "@/types";
import { FinalCycleBadge } from "./settlement-badge";

const MIN_JUSTIFICATION = 20;

/**
 * Release the next cycle.
 *
 * One dialog for both paths on purpose: forcing a renewal is the same decision
 * made against an unsettled cycle, and splitting it into a separate screen
 * would hide the settlement picture at the moment it matters most.
 */
export function ApproveCycleDialog({
  target,
  open,
  onOpenChange,
  onDone,
}: {
  target: CycleApprovalResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [notes, setNotes] = useState("");
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setNewValue(
      target.suggested_new_value != null
        ? String(target.suggested_new_value)
        : String(target.previous_installment_value ?? "")
    );
    setNotes("");
    setJustification("");
  }, [target]);

  if (!target) return null;

  const blocked = !target.can_approve;
  const unpaid = target.cycle_unpaid ?? 0;
  const justificationTooShort = justification.trim().length < MIN_JUSTIFICATION;
  const canSubmit =
    Boolean(newValue) && Number(newValue) > 0 && (!blocked || !justificationTooShort);

  async function handleSubmit() {
    if (!target || !canSubmit) return;
    setSaving(true);
    try {
      if (blocked) {
        await forceApproveCycle(target.id, {
          new_installment_value: Number(newValue),
          justification: justification.trim(),
          admin_notes: notes || undefined,
        });
        toast.success(
          `Ciclo ${target.cycle_number} liberado com ${unpaid} parcela(s) em aberto.`
        );
      } else {
        await approveCycle(target.id, {
          new_installment_value: Number(newValue),
          admin_notes: notes || undefined,
        });
        toast.success(`Ciclo ${target.cycle_number} aprovado. Boletos em geração.`);
      }
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao liberar o ciclo"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {blocked ? "Renovar agora" : "Aprovar ciclo"}
            {target.is_final_cycle && <FinalCycleBadge />}
          </DialogTitle>
          <DialogDescription>
            {target.client_name} — Ciclo #{target.cycle_number}
            {target.lot_identifier ? ` · ${target.lot_identifier}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* What approving actually does, in plain words. */}
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Ao liberar, o sistema grava o novo valor da parcela, gera as próximas
            parcelas do contrato e envia os boletos para registro no banco.
          </p>

          {blocked && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Ciclo anterior não quitado
              </p>
              <p className="mt-1 text-xs text-destructive/90">{target.blocked_reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Renovar assim mesmo é registrado com seu nome e a justificativa
                abaixo, e fica no histórico do contrato.
              </p>
            </div>
          )}

          {target.is_final_cycle && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Último ciclo do contrato</p>
              <p className="mt-1 text-xs">
                Inicie a escrituração: o checklist de documentos já está aberto na
                linha deste contrato.
              </p>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg bg-muted p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor anterior</span>
              <span className="font-semibold">
                {formatCurrency(target.previous_installment_value)}
              </span>
            </div>
            {target.remaining_installments != null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Débito do ciclo</span>
                <span className="font-medium">
                  gera {target.installments_to_generate ?? 0} — restam{" "}
                  {target.remaining_installments} de {target.total_installments ?? "?"}
                </span>
              </div>
            )}
            {target.last_adjustment_date && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último reajuste</span>
                <span className="font-medium">
                  {formatDate(target.last_adjustment_date)}
                </span>
              </div>
            )}
          </div>

          {target.effective_rates && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                Taxas aplicadas (revise antes de aprovar)
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-amber-900">
                <span>
                  Multa: <strong>{target.effective_rates.penalty_rate}%</strong>
                </span>
                <span>
                  Juros/dia: <strong>{target.effective_rates.daily_interest_rate}%</strong>
                </span>
                <span>
                  Índice: <strong>{target.effective_rates.adjustment_index}</strong>
                </span>
                <span>
                  Taxa fixa: <strong>{target.effective_rates.adjustment_custom_rate}%</strong>
                </span>
              </div>
            </div>
          )}

          {target.suggested_new_value != null && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <div className="flex items-center justify-between">
                <span>Valor sugerido (índice + taxa fixa)</span>
                <span className="font-semibold">
                  {formatCurrency(target.suggested_new_value)}
                </span>
              </div>
              <p className="mt-1 text-xs text-green-700">
                Já preenchido abaixo. Edite se precisar antes de liberar.
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Novo valor da parcela *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="mt-1"
            />
          </div>

          {blocked && (
            <div>
              <label className="text-sm font-medium">
                Justificativa da renovação forçada *
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Ex.: cliente renegociou as parcelas em aberto presencialmente em 12/03."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {justification.trim().length}/{MIN_JUSTIFICATION} caracteres mínimos
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Observações (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={2}
              placeholder="Detalhes sobre o ajuste..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !canSubmit}
              className={
                blocked ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {blocked ? "Renovar agora" : "Aprovar ciclo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
