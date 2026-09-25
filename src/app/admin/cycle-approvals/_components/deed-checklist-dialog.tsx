"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileSignature, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { getDeedChecklist, updateDeedChecklist } from "@/services/admin";
import type { DeedChecklistResponse } from "@/types";

/**
 * Escrituração checklist for a contract on its final cycle.
 *
 * Items resolve against the documents the client already uploaded, so a
 * document that is on file is marked as such instead of being asked for twice.
 */
export function DeedChecklistDialog({
  clientLotId,
  clientName,
  open,
  onOpenChange,
}: {
  clientLotId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [checklist, setChecklist] = useState<DeedChecklistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!clientLotId) return;
    setLoading(true);
    try {
      const data = await getDeedChecklist(clientLotId);
      setChecklist(data);
      setNotes(data.notes ?? "");
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao carregar o checklist"
      );
    } finally {
      setLoading(false);
    }
  }, [clientLotId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function toggle(documentType: string, done: boolean) {
    if (!clientLotId) return;
    try {
      setChecklist(await updateDeedChecklist(clientLotId, { document_type: documentType, done }));
    } catch {
      toast.error("Erro ao atualizar o item");
    }
  }

  async function saveNotes() {
    if (!clientLotId) return;
    try {
      setChecklist(await updateDeedChecklist(clientLotId, { notes }));
      toast.success("Anotações salvas");
    } catch {
      toast.error("Erro ao salvar as anotações");
    }
  }

  const done = checklist?.items.filter((i) => i.done).length ?? 0;
  const total = checklist?.items.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-amber-600" />
            Escrituração — {clientName}
          </DialogTitle>
          <DialogDescription>
            Documentos necessários para lavrar a escritura. Itens já enviados pelo
            cliente aparecem marcados como &quot;em arquivo&quot;.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : checklist ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">
                {done} de {total} concluídos
              </span>
            </div>

            <div className="space-y-2">
              {checklist.items.map((item) => {
                const onFile = checklist.uploaded_document_types.includes(
                  item.document_type
                );
                return (
                  <label
                    key={item.document_type}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={(v) => toggle(item.document_type, v === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      {onFile && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          documento em arquivo
                        </span>
                      )}
                      {item.note && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="text-sm font-medium">Anotações</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Cartório, prazos, pendências..."
              />
              <div className="mt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={saveNotes}>
                  Salvar anotações
                </Button>
              </div>
            </div>

            {checklist.completed_at && (
              <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
                Checklist concluído. O contrato está pronto para escrituração.
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
