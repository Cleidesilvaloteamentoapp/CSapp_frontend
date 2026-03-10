"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBatchProgress } from "@/hooks/use-batch-progress";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

interface BatchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  onComplete?: () => void;
}

const ITEM_STATUS_ICON = {
  SUCCESS: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  PROCESSING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  PENDING: <Clock className="h-4 w-4 text-gray-400" />,
};

const BATCH_STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Aguardando", variant: "outline" },
  PROCESSING: { label: "Processando", variant: "default" },
  COMPLETED: { label: "Concluído", variant: "secondary" },
  FAILED: { label: "Falhou", variant: "destructive" },
};

export function BatchProgressDialog({
  open,
  onOpenChange,
  batchId,
  onComplete,
}: BatchProgressDialogProps) {
  const { data, loading } = useBatchProgress(open ? batchId : null);

  const isFinished = data?.status === "COMPLETED" || data?.status === "FAILED";
  const progressPercent = data
    ? Math.round(((data.completed_items + data.failed_items) / Math.max(data.total_items, 1)) * 100)
    : 0;

  const statusBadge = data ? BATCH_STATUS_BADGE[data.status] || BATCH_STATUS_BADGE.PENDING : null;

  function handleClose() {
    if (isFinished && onComplete) {
      onComplete();
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Progresso da Operação em Lote
            {statusBadge && (
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {data
              ? `${data.completed_items + data.failed_items} de ${data.total_items} itens processados`
              : "Carregando progresso..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent}%</span>
              <div className="flex gap-3">
                <span className="text-green-600">
                  ✓ {data?.completed_items ?? 0}
                </span>
                <span className="text-red-600">
                  ✗ {data?.failed_items ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Items list */}
          {data?.results && data.results.length > 0 && (
            <ScrollArea className="h-60 rounded-md border p-3">
              <div className="space-y-2">
                {data.results.map((item, i) => (
                  <div
                    key={`${item.nosso_numero}-${i}`}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2">
                      {ITEM_STATUS_ICON[item.status]}
                      <span className="font-mono text-xs">
                        {item.nosso_numero}
                      </span>
                    </div>
                    {item.error && (
                      <span className="text-xs text-red-500 truncate max-w-[200px]">
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Error summary */}
          {data?.error_summary && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
              {data.error_summary}
            </div>
          )}

          {/* Loading state */}
          {loading && !data && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={handleClose}
              variant={isFinished ? "default" : "outline"}
            >
              {isFinished ? "Fechar" : "Executar em Segundo Plano"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
