"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { InstallmentInfo } from "@/types";

interface InstallmentInfoCardProps {
  info: InstallmentInfo;
  showActions?: boolean;
  onGenerateNextBatch?: () => void;
}

export function InstallmentInfoCard({
  info,
  showActions = false,
  onGenerateNextBatch,
}: InstallmentInfoCardProps) {
  const progressPercent =
    info.total_installments > 0
      ? Math.round((info.paid_installments / info.total_installments) * 100)
      : 0;

  const isCycleComplete = info.installments_in_current_cycle >= 12;
  const hasRemainingInstallments = info.remaining_installments > 0;
  const isReadyForNextCycle = isCycleComplete && hasRemainingInstallments;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Parcelas do Contrato</CardTitle>
          {isCycleComplete && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ciclo Completo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-2xl font-bold">{info.total_installments}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg bg-green-50 p-2">
            <p className="text-2xl font-bold text-green-600">
              {info.paid_installments}
            </p>
            <p className="text-xs text-muted-foreground">Pagas</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-2">
            <p className="text-2xl font-bold text-blue-600">
              {info.remaining_installments}
            </p>
            <p className="text-xs text-muted-foreground">Restantes</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Cycle Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ciclo Atual</p>
            <p className="font-semibold">{info.current_cycle}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor Atual</p>
            <p className="font-semibold">
              {info.current_installment_value
                ? formatCurrency(info.current_installment_value)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Parcelas no Ciclo</p>
            <p className="font-semibold">
              {info.installments_in_current_cycle}/12
            </p>
          </div>
          {info.is_legacy_client && (
            <div>
              <Badge variant="outline" className="text-xs">
                Cliente Legado
              </Badge>
            </div>
          )}
        </div>

        {/* Ready for Next Cycle Badge */}
        {isReadyForNextCycle && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Próximo lote pronto para geração
              </span>
            </div>
            <p className="mt-1 text-xs text-yellow-700">
              Ciclo {info.current_cycle} completo. Gere o ciclo {info.next_cycle_number} com {Math.min(12, info.remaining_installments)} boletos.
            </p>
          </div>
        )}

        {/* Action Button */}
        {showActions && isReadyForNextCycle && onGenerateNextBatch && (
          <button
            onClick={onGenerateNextBatch}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Gerar Próximo Lote (Ciclo {info.next_cycle_number})
          </button>
        )}
      </CardContent>
    </Card>
  );
}
