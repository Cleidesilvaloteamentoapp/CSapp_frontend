"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftRight, Plus, Loader2, CheckCircle, PlayCircle, XCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle,
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import {
  listTransfers,
  createTransfer,
  getTransferDetail,
  approveTransfer,
  completeTransfer,
  cancelTransfer,
} from "@/services/admin";
import type { ContractTransferResponse, TransferStatus } from "@/types";
import { WORKFLOW_STATUS_CONFIG } from "@/types";
import { PermissionGuard } from "@/components/shared/permission-guard";

const STATUS_FLOW: Record<TransferStatus, { next: string; color: string }> = {
  PENDING: { next: "APPROVED", color: "bg-yellow-500" },
  APPROVED: { next: "COMPLETED", color: "bg-green-500" },
  COMPLETED: { next: "", color: "bg-blue-500" },
  CANCELLED: { next: "", color: "bg-gray-400" },
};

export default function TransfersPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [transfers, setTransfers] = useState<ContractTransferResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isSuperAdmin, router]);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [formLotId, setFormLotId] = useState("");
  const [formToClientId, setFormToClientId] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formReason, setFormReason] = useState("");
  const [creating, setCreating] = useState(false);

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ContractTransferResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Actions
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "complete" | "cancel";
    transfer: ContractTransferResponse;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await listTransfers(params);
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar transferências");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!formLotId || !formToClientId) return;
    setCreating(true);
    try {
      await createTransfer({
        client_lot_id: formLotId,
        to_client_id: formToClientId,
        transfer_fee: formFee ? parseFloat(formFee) : undefined,
        reason: formReason || undefined,
      });
      toast.success("Transferência criada com sucesso");
      setCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao criar transferência");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleViewDetail(item: ContractTransferResponse) {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const data = await getTransferDetail(item.id);
      setDetail(data);
    } catch {
      setDetail(item);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { type, transfer } = confirmAction;
      if (type === "approve") {
        await approveTransfer(transfer.id);
        toast.success("Transferência aprovada");
      } else if (type === "complete") {
        await completeTransfer(transfer.id);
        toast.success("Transferência concluída — dados migrados");
      } else {
        await cancelTransfer(transfer.id);
        toast.success("Transferência cancelada");
      }
      setConfirmAction(null);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro na operação");
      }
    } finally {
      setActionLoading(false);
    }
  }

  function resetForm() {
    setFormLotId("");
    setFormToClientId("");
    setFormFee("");
    setFormReason("");
  }

  function getStatusBadge(status: TransferStatus) {
    const cfg = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.PENDING;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  }

  function getStatusFlowIndicator(status: TransferStatus) {
    const steps: TransferStatus[] = ["PENDING", "APPROVED", "COMPLETED"];
    const currentIdx = steps.indexOf(status);
    if (status === "CANCELLED") {
      return (
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              {i < steps.length - 1 && <div className="h-0.5 w-4 bg-gray-200" />}
            </div>
          ))}
          <Badge variant="secondary" className="ml-2 text-xs">Cancelado</Badge>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${
                i <= currentIdx ? STATUS_FLOW[s].color : "bg-gray-200"
              }`}
            />
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-4 ${i < currentIdx ? STATUS_FLOW[s].color : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const confirmDialogConfig = confirmAction
    ? {
        approve: {
          title: "Aprovar Transferência",
          description: `Aprovar a transferência do lote ${confirmAction.transfer.lot_identifier} de ${confirmAction.transfer.from_client_name} para ${confirmAction.transfer.to_client_name}?`,
          label: "Aprovar",
          destructive: false,
        },
        complete: {
          title: "Concluir Transferência",
          description: `Concluir a transferência? O lote, faturas pendentes e boletos serão migrados para ${confirmAction.transfer.to_client_name}. Esta ação não pode ser desfeita.`,
          label: "Concluir Transferência",
          destructive: false,
        },
        cancel: {
          title: "Cancelar Transferência",
          description: `Cancelar a transferência do lote ${confirmAction.transfer.lot_identifier}?`,
          label: "Cancelar Transferência",
          destructive: true,
        },
      }[confirmAction.type]
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Transferências de Contrato" description="Gerencie transferências de lotes entre clientes">
        <PermissionGuard permission="manage_clients">
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transferência
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="APPROVED">Aprovadas</SelectItem>
            <SelectItem value="COMPLETED">Concluídas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton />
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ArrowLeftRight className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhuma transferência encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De (Cliente)</TableHead>
                    <TableHead>Para (Cliente)</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.from_client_name || "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {t.to_client_name || "—"}
                      </TableCell>
                      <TableCell>{t.lot_identifier || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(t.status)}
                          <div>{getStatusFlowIndicator(t.status)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.transfer_fee != null
                          ? formatCurrency(t.transfer_fee)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.transfer_date ? formatDate(t.transfer_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDetail(t)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {t.status === "PENDING" && (
                            <PermissionGuard permission="manage_clients">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                onClick={() => setConfirmAction({ type: "approve", transfer: t })}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            </PermissionGuard>
                          )}
                          {t.status === "APPROVED" && (
                            <PermissionGuard permission="manage_clients">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={() => setConfirmAction({ type: "complete", transfer: t })}
                              >
                                <PlayCircle className="h-3.5 w-3.5" />
                              </Button>
                            </PermissionGuard>
                          )}
                          {(t.status === "PENDING" || t.status === "APPROVED") && (
                            <PermissionGuard permission="manage_clients">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setConfirmAction({ type: "cancel", transfer: t })}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </PermissionGuard>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transferência de Contrato</DialogTitle>
            <DialogDescription>
              Selecione o lote e o cliente destino para iniciar a transferência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">ID do Lote (client_lot_id) *</label>
              <Input
                value={formLotId}
                onChange={(e) => setFormLotId(e.target.value)}
                className="mt-1"
                placeholder="UUID do lote atribuído"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ID do Cliente Destino *</label>
              <Input
                value={formToClientId}
                onChange={(e) => setFormToClientId(e.target.value)}
                className="mt-1"
                placeholder="UUID do cliente destino"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Taxa de Transferência (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formFee}
                onChange={(e) => setFormFee(e.target.value)}
                className="mt-1"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motivo</label>
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="mt-1"
                rows={2}
                placeholder="Opcional"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !formLotId || !formToClientId}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Transferência
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Transferência</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">De</p>
                  <p className="font-semibold">{detail.from_client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Para</p>
                  <p className="font-semibold">{detail.to_client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="font-medium">{detail.lot_identifier || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(detail.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                  <p>{detail.transfer_fee != null ? formatCurrency(detail.transfer_fee) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p>{detail.transfer_date ? formatDate(detail.transfer_date) : "—"}</p>
                </div>
              </div>
              {detail.reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Motivo</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{detail.reason}</p>
                </div>
              )}
              {detail.admin_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{detail.admin_notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      {confirmDialogConfig && (
        <ConfirmationDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmDialogConfig.title}
          description={confirmDialogConfig.description}
          confirmLabel={confirmDialogConfig.label}
          destructive={confirmDialogConfig.destructive}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
