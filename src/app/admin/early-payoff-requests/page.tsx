"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FastForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import {
  listEarlyPayoffRequests,
  updateEarlyPayoffStatus,
} from "@/services/admin";
import type { EarlyPayoffResponse, EarlyPayoffStatus } from "@/types";
import { WORKFLOW_STATUS_CONFIG } from "@/types";

const STATUS_OPTIONS: { value: EarlyPayoffStatus; label: string }[] = [
  { value: "CONTACTED", label: "Contactado" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function EarlyPayoffRequestsPage() {
  const [requests, setRequests] = useState<EarlyPayoffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Update dialog
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<EarlyPayoffResponse | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await listEarlyPayoffRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleUpdateStatus() {
    if (!updateTarget || !newStatus) return;
    setUpdating(true);
    try {
      await updateEarlyPayoffStatus(updateTarget.id, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      });
      toast.success("Status atualizado com sucesso");
      setUpdateOpen(false);
      setUpdateTarget(null);
      setNewStatus("");
      setAdminNotes("");
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao atualizar");
      }
    } finally {
      setUpdating(false);
    }
  }

  function getStatusBadge(status: EarlyPayoffStatus) {
    const cfg = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.PENDING;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  }

  function getStatusSteps(status: EarlyPayoffStatus) {
    const steps: { key: EarlyPayoffStatus; label: string }[] = [
      { key: "PENDING", label: "Pendente" },
      { key: "CONTACTED", label: "Contactado" },
      { key: "COMPLETED", label: "Concluído" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === status);
    if (status === "CANCELLED") {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Cancelado</Badge>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${
                i <= currentIdx ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-3 ${i < currentIdx ? "bg-blue-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitações de Antecipação"
        description="Gerencie solicitações de pagamento antecipado dos clientes"
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="CONTACTED">Contactados</SelectItem>
            <SelectItem value="COMPLETED">Concluídos</SelectItem>
            <SelectItem value="CANCELLED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton />
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FastForward className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.client_name || "—"}
                      </TableCell>
                      <TableCell>{r.lot_identifier || "—"}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{getStatusSteps(r.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {r.client_message || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(r.requested_at)}
                      </TableCell>
                      <TableCell>
                        {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUpdateTarget(r);
                              setNewStatus("");
                              setAdminNotes(r.admin_notes || "");
                              setUpdateOpen(true);
                            }}
                          >
                            Atualizar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Solicitação</DialogTitle>
            <DialogDescription>
              {updateTarget?.client_name} — {updateTarget?.lot_identifier}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {updateTarget?.client_message && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Mensagem do Cliente</p>
                <p className="text-sm">{updateTarget.client_message}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Novo Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações do Admin</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Anotações internas..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUpdateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updating || !newStatus}
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
