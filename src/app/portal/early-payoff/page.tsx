"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FastForward, Loader2, Send, Clock, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import { requestEarlyPayoff, listMyEarlyPayoffRequests, getMyLots } from "@/services/portal";
import {
  EARLY_PAYOFF_STATUS_CONFIG,
  type ClientEarlyPayoffResponse,
  type ClientEarlyPayoffStatus,
} from "@/types/portal";
import type { ClientLot } from "@/types/portal";

export default function PortalEarlyPayoffPage() {
  const [requests, setRequests] = useState<ClientEarlyPayoffResponse[]>([]);
  const [lots, setLots] = useState<ClientLot[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reqData, lotData] = await Promise.all([
        listMyEarlyPayoffRequests(),
        getMyLots(),
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setLots(Array.isArray(lotData) ? lotData : []);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedLot) return;
    setSubmitting(true);
    try {
      await requestEarlyPayoff({
        client_lot_id: selectedLot,
        client_message: message || undefined,
      });
      toast.success("Solicitação de antecipação enviada com sucesso!");
      setCreateOpen(false);
      setSelectedLot("");
      setMessage("");
      loadData();
    } catch {
      toast.error("Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusSteps(status: ClientEarlyPayoffStatus) {
    const steps = [
      { key: "PENDING" as const, label: "Pendente", icon: Clock },
      { key: "CONTACTED" as const, label: "Contactado", icon: Phone },
      { key: "COMPLETED" as const, label: "Concluído", icon: CheckCircle },
    ];
    const currentIdx = steps.findIndex((s) => s.key === status);
    if (status === "CANCELLED") {
      return (
        <Badge variant="secondary">Cancelado</Badge>
      );
    }
    return (
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const isActive = i <= currentIdx;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 ${isActive ? "text-blue-600" : "text-muted-foreground/40"}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-4 rounded ${i < currentIdx ? "bg-blue-500" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antecipar Pagamento"
        description="Solicite a antecipação do pagamento do seu lote"
      >
        <Button onClick={() => setCreateOpen(true)}>
          <FastForward className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </PageHeader>

      {loading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FastForward className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Nenhuma solicitação de antecipação
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              Faça sua primeira solicitação de pagamento antecipado
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <FastForward className="mr-2 h-4 w-4" />
              Solicitar Antecipação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = EARLY_PAYOFF_STATUS_CONFIG[req.status] || EARLY_PAYOFF_STATUS_CONFIG.PENDING;
            return (
              <Card key={req.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(req.requested_at)}
                        </span>
                      </div>
                      <div className="mt-2">
                        {getStatusSteps(req.status)}
                      </div>
                      {req.client_message && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Sua mensagem:</span> {req.client_message}
                        </p>
                      )}
                      {req.admin_notes && (
                        <div className="rounded-lg bg-muted p-2 mt-2">
                          <p className="text-xs text-muted-foreground">Resposta do admin:</p>
                          <p className="text-sm">{req.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Antecipação de Pagamento</DialogTitle>
            <DialogDescription>
              Selecione o lote e envie uma mensagem opcional para a administração.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selecione o Lote *</label>
              <Select value={selectedLot} onValueChange={setSelectedLot}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number} — {lot.development_name || "Lote"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lots.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhum lote encontrado
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Gostaria de antecipar o pagamento..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedLot}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
