"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { BATCH_ACTION_LABELS, ACTIONS_BY_STATUS } from "@/types/sicredi";
import type { BatchAction, BoletoSituacao } from "@/types/sicredi";

interface BatchOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNossoNumeros: string[];
  selectedStatuses: BoletoSituacao[];
  onBatchStarted: (batchId: string) => void;
}

function getAvailableActions(statuses: BoletoSituacao[]): BatchAction[] {
  if (statuses.length === 0) return [];
  const actionSets = statuses.map(
    (s) => new Set(ACTIONS_BY_STATUS[s] || [])
  );
  const intersection = actionSets.reduce((acc, set) => {
    return new Set([...acc].filter((a) => set.has(a)));
  });
  return [...intersection] as BatchAction[];
}

export function BatchOperationDialog({
  open,
  onOpenChange,
  selectedNossoNumeros,
  selectedStatuses,
  onBatchStarted,
}: BatchOperationDialogProps) {
  const { batchOperation, loading } = useSicrediBoletos();

  const [action, setAction] = useState<BatchAction | "">("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [valorOuPercentual, setValorOuPercentual] = useState("");
  const [valorAbatimento, setValorAbatimento] = useState("");

  const availableActions = getAvailableActions(selectedStatuses);

  const needsDate = action === "ALTERAR_VENCIMENTO";
  const needsValorPerc = action === "ALTERAR_JUROS" || action === "ALTERAR_DESCONTO";
  const needsAbatimento = action === "CONCEDER_ABATIMENTO";

  const canSubmit =
    action !== "" &&
    (!needsDate || dataVencimento !== "") &&
    (!needsValorPerc || valorOuPercentual !== "") &&
    (!needsAbatimento || valorAbatimento !== "");

  function resetForm() {
    setAction("");
    setDataVencimento("");
    setValorOuPercentual("");
    setValorAbatimento("");
  }

  async function handleSubmit() {
    if (!action) return;

    const result = await batchOperation({
      nosso_numeros: selectedNossoNumeros,
      action: action as BatchAction,
      ...(needsDate && { data_vencimento: dataVencimento }),
      ...(needsValorPerc && { valor_ou_percentual: valorOuPercentual }),
      ...(needsAbatimento && { valor_abatimento: parseFloat(valorAbatimento) }),
    });

    if (result) {
      toast.success(`Operação em lote iniciada: ${result.total_items} boletos`);
      onBatchStarted(result.batch_id);
      resetForm();
      onOpenChange(false);
    } else {
      toast.error("Erro ao iniciar operação em lote");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Operação em Lote</DialogTitle>
          <DialogDescription>
            Aplicar ação a{" "}
            <Badge variant="secondary" className="mx-1">
              {selectedNossoNumeros.length}
            </Badge>{" "}
            boletos selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableActions.length === 0 ? (
            <p className="text-sm text-destructive">
              Nenhuma ação compatível com os status selecionados.
            </p>
          ) : (
            <>
              {/* Action select */}
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select
                  value={action}
                  onValueChange={(v) => setAction(v as BatchAction)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableActions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {BATCH_ACTION_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields */}
              {needsDate && (
                <div className="space-y-2">
                  <Label>Nova Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              )}

              {needsValorPerc && (
                <div className="space-y-2">
                  <Label>
                    {action === "ALTERAR_JUROS"
                      ? "Valor ou Percentual de Juros"
                      : "Valor do Desconto (R$)"}
                  </Label>
                  <Input
                    type="text"
                    value={valorOuPercentual}
                    onChange={(e) => setValorOuPercentual(e.target.value)}
                    placeholder="2.50"
                  />
                </div>
              )}

              {needsAbatimento && (
                <div className="space-y-2">
                  <Label>Valor do Abatimento (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorAbatimento}
                    onChange={(e) => setValorAbatimento(e.target.value)}
                    placeholder="5.00"
                  />
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {availableActions.length > 0 && (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Executar em {selectedNossoNumeros.length} boletos
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
