"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Ban, Loader2, CheckCircle, PlayCircle, RotateCcw, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  listRescissions, approveRescission, completeRescission, revertRescission,
} from "@/services/admin";
import type { RescissionResponse, RescissionStatus } from "@/types";
import { PermissionGuard } from "@/components/shared/permission-guard";

const STATUS_CFG: Record<RescissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  REQUESTED: { label: "Solicitada", variant: "outline" },
  PENDING_APPROVAL: { label: "Aguardando aprovação", variant: "outline" },
  APPROVED: { label: "Aprovada", variant: "default" },
  COMPLETED: { label: "Concluída", variant: "secondary" },
  CANCELLED: { label: "Revertida/Cancelada", variant: "secondary" },
};

export default function RescissionsPage() {
  const [items, setItems] = useState<RescissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_APPROVAL");

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<RescissionResponse | null>(null);
  const [refund, setRefund] = useState("");
  const [penalty, setPenalty] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approving, setApproving] = useState(false);

  // Detail
  const [detail, setDetail] = useState<RescissionResponse | null>(null);

  // Confirm (complete / revert)
  const [confirmAction, setConfirmAction] = useState<{ type: "complete" | "revert"; item: RescissionResponse } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await listRescissions(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar rescisões");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const pendingCount = items.filter(
    (r) => r.status === "PENDING_APPROVAL" || r.status === "REQUESTED"
  ).length;

  async function handleApprove() {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await approveRescission(approveTarget.id, {
        approved: true,
        refund_amount: refund ? parseFloat(refund) : 0,
        penalty_amount: penalty ? parseFloat(penalty) : 0,
        admin_notes: approveNotes || undefined,
      });
      toast.success("Rescisão aprovada. Conclua para liberar o lote.");
      setApproveTarget(null);
      setRefund(""); setPenalty(""); setApproveNotes("");
      loadData();
    } catch (err) {
      if (err instanceof ApiError) toast.error(typeof err.detail === "string" ? err.detail : "Erro ao aprovar");
    } finally {
      setApproving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "complete") {
        await completeRescission(confirmAction.item.id);
        toast.success("Rescisão concluída — lote liberado para revenda.");
      } else {
        await revertRescission(confirmAction.item.id, {});
        toast.success("Rescisão revertida — contrato reativado e cobrança retomada.");
      }
      setConfirmAction(null);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) toast.error(typeof err.detail === "string" ? err.detail : "Erro na operação");
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: RescissionStatus) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING_APPROVAL;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  }

  const isOpen = (s: RescissionStatus) => s === "REQUESTED" || s === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      <PageHeader title="Rescisões (Distrato)" description="Inadimplência: aprove para liberar o lote ou reverta após negociação">
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </Badge>
        )}
      </PageHeader>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs text-amber-800">
          Rescisões automáticas (≥3 parcelas em atraso ou &gt;90 dias) entram como <strong>pendentes</strong> e
          <strong> suspendem a cobrança</strong> sem apagar o histórico. Aprovar + Concluir libera o lote para revenda;
          Reverter reativa o contrato caso o cliente negocie.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Aguardando aprovação</SelectItem>
            <SelectItem value="REQUESTED">Solicitadas</SelectItem>
            <SelectItem value="APPROVED">Aprovadas</SelectItem>
            <SelectItem value="COMPLETED">Concluídas</SelectItem>
            <SelectItem value="CANCELLED">Revertidas/Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Ban className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhuma rescisão encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Dívida</TableHead>
                    <TableHead>Solicitada</TableHead>
                    <TableHead className="w-36"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-xs truncate font-medium" title={r.reason}>{r.reason}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{formatCurrency(r.total_paid)}</TableCell>
                      <TableCell>{formatCurrency(r.total_debt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.request_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetail(r)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <PermissionGuard permission="manage_rescissions">
                            <>
                              {isOpen(r.status) && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="Aprovar"
                                  onClick={() => { setApproveTarget(r); setRefund(""); setPenalty(""); setApproveNotes(""); }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {r.status === "APPROVED" && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="Concluir (libera o lote)"
                                  onClick={() => setConfirmAction({ type: "complete", item: r })}
                                >
                                  <PlayCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(isOpen(r.status) || r.status === "APPROVED") && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                                  title="Reverter (reativa o contrato)"
                                  onClick={() => setConfirmAction({ type: "revert", item: r })}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          </PermissionGuard>
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

      {/* Approve dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Rescisão</DialogTitle>
            <DialogDescription>
              Defina os valores financeiros. Após aprovar, use &quot;Concluir&quot; para liberar o lote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">{approveTarget?.reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Reembolso (R$)</label>
                <Input type="number" step="0.01" min="0" value={refund} onChange={(e) => setRefund(e.target.value)} className="mt-1" placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium">Multa retida (R$)</label>
                <Input type="number" step="0.01" min="0" value={penalty} onChange={(e) => setPenalty(e.target.value)} className="mt-1" placeholder="0,00" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} className="mt-1" rows={2} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancelar</Button>
              <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
                {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Aprovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da Rescisão</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(detail.status)}</div>
                <div><p className="text-xs text-muted-foreground">Solicitada</p><p className="text-sm">{formatDate(detail.request_date)}</p></div>
                <div><p className="text-xs text-muted-foreground">Total pago</p><p className="font-medium">{formatCurrency(detail.total_paid)}</p></div>
                <div><p className="text-xs text-muted-foreground">Dívida</p><p className="font-medium">{formatCurrency(detail.total_debt)}</p></div>
                <div><p className="text-xs text-muted-foreground">Reembolso</p><p>{formatCurrency(detail.refund_amount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Multa retida</p><p>{formatCurrency(detail.penalty_amount)}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground mb-1">Motivo</p><p className="text-sm bg-muted rounded-lg p-3">{detail.reason}</p></div>
              {detail.admin_notes && (
                <div><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm bg-muted rounded-lg p-3">{detail.admin_notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmAction && (
        <ConfirmationDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.type === "complete" ? "Concluir Rescisão" : "Reverter Rescisão"}
          description={
            confirmAction.type === "complete"
              ? "As parcelas pendentes serão canceladas e o lote liberado para revenda. Esta ação não pode ser desfeita."
              : "O contrato será reativado, a cobrança retomada e a inadimplência removida. Use após o cliente negociar."
          }
          confirmLabel={confirmAction.type === "complete" ? "Concluir e liberar lote" : "Reverter contrato"}
          destructive={confirmAction.type === "complete"}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
