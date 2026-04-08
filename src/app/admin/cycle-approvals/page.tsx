"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Eye, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
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
import { formatCurrency, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import {
  listCycleApprovals,
  getCycleApprovalDetail,
  approveCycle,
  rejectCycle,
  getInstallmentInfo,
  generateNextBatch,
} from "@/services/admin";
import { createBatchBoletos } from "@/services/sicredi";
import type { CycleApprovalResponse, CycleApprovalStatus, InstallmentInfo } from "@/types";
import { WORKFLOW_STATUS_CONFIG } from "@/types";
import { InstallmentInfoCard } from "@/components/shared/installment-info-card";

export default function CycleApprovalsPage() {
  const [approvals, setApprovals] = useState<CycleApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<CycleApprovalResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approve
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<CycleApprovalResponse | null>(null);
  const [newValue, setNewValue] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CycleApprovalResponse | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // New Cycle Management (12x12)
  const [selectedClientLotId, setSelectedClientLotId] = useState<string | null>(null);
  const [installmentInfo, setInstallmentInfo] = useState<InstallmentInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  
  // Renew Cycle Dialog
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewClientLotId, setRenewClientLotId] = useState<string | null>(null);
  const [renewClientName, setRenewClientName] = useState<string>("");
  const [renewInstallmentInfo, setRenewInstallmentInfo] = useState<InstallmentInfo | null>(null);
  const [adjustmentRate, setAdjustmentRate] = useState<string>("5.00");
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewStep, setRenewStep] = useState<"prepare" | "create">("prepare");
  const [prepareResult, setPrepareResult] = useState<{ new_installment_value: number; remaining_installments: number } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await listCycleApprovals(params);
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar aprovações");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  async function handleViewDetail(item: CycleApprovalResponse) {
    setDetailLoading(true);
    setDetailOpen(true);
    setSelectedClientLotId(item.client_lot_id);
    try {
      const [data, installmentData] = await Promise.all([
        getCycleApprovalDetail(item.id),
        getInstallmentInfo(item.client_lot_id).catch(() => null),
      ]);
      setDetail(data);
      setInstallmentInfo(installmentData);
    } catch {
      setDetail(item);
      setInstallmentInfo(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleApprove() {
    if (!approveTarget || !newValue) return;
    setApproving(true);
    try {
      await approveCycle(approveTarget.id, {
        new_installment_value: parseFloat(newValue),
        admin_notes: approveNotes || undefined,
      });
      toast.success("Ciclo aprovado com sucesso");
      setApproveOpen(false);
      setApproveTarget(null);
      setNewValue("");
      setApproveNotes("");
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao aprovar");
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || rejectNotes.length < 5) return;
    setRejecting(true);
    try {
      await rejectCycle(rejectTarget.id, { admin_notes: rejectNotes });
      toast.success("Ciclo rejeitado");
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectNotes("");
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao rejeitar");
      }
    } finally {
      setRejecting(false);
    }
  }

  async function loadInstallmentInfo(clientLotId: string) {
    setInfoLoading(true);
    try {
      const info = await getInstallmentInfo(clientLotId);
      setInstallmentInfo(info);
      setSelectedClientLotId(clientLotId);
    } catch (err) {
      toast.error("Erro ao carregar informações de parcelas");
    } finally {
      setInfoLoading(false);
    }
  }

  function openRenewDialog(clientLotId: string, clientName: string) {
    setRenewClientLotId(clientLotId);
    setRenewClientName(clientName);
    setRenewStep("prepare");
    setAdjustmentRate("5.00");
    setPrepareResult(null);
    setRenewDialogOpen(true);
    // Load installment info
    getInstallmentInfo(clientLotId)
      .then((info) => setRenewInstallmentInfo(info))
      .catch(() => toast.error("Erro ao carregar informações do contrato"));
  }

  async function handlePrepareRenew() {
    if (!renewClientLotId) return;
    setRenewLoading(true);
    try {
      const rate = parseFloat(adjustmentRate) / 100;
      const result = await generateNextBatch(renewClientLotId, rate);
      setPrepareResult({
        new_installment_value: result.new_installment_value,
        remaining_installments: result.remaining_installments,
      });
      setRenewStep("create");
      toast.success(result.message);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao preparar ciclo");
      }
    } finally {
      setRenewLoading(false);
    }
  }

  async function handleCreateBatch() {
    if (!renewClientLotId || !prepareResult) return;
    setRenewLoading(true);
    try {
      const duration = Math.min(12, prepareResult.remaining_installments);
      // Calculate first due date (next month from today)
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      nextDue.setDate(10); // Due on 10th of each month
      
      await createBatchBoletos({
        client_id: renewInstallmentInfo?.client_lot_id || "",
        pagador: {} as any, // Will be filled from client data
        valor: prepareResult.new_installment_value,
        frequency: "MENSAL",
        duration_months: duration,
        data_primeiro_vencimento: nextDue.toISOString().split("T")[0],
      });
      
      toast.success(`✅ ${duration} boletos gerados para o ciclo ${(renewInstallmentInfo?.current_cycle || 0) + 1}`);
      setRenewDialogOpen(false);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao criar boletos");
      }
    } finally {
      setRenewLoading(false);
    }
  }

  function getStatusBadge(status: CycleApprovalStatus) {
    const cfg = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.PENDING;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Aprovação de Ciclos" description="Gerencie aprovações de ciclos de 12 parcelas">
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </Badge>
        )}
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
            <SelectItem value="APPROVED">Aprovados</SelectItem>
            <SelectItem value="REJECTED">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton />
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhuma aprovação encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Ciclo #</TableHead>
                    <TableHead>Valor Anterior</TableHead>
                    <TableHead>Novo Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.client_name || "—"}
                      </TableCell>
                      <TableCell>{item.lot_identifier || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">#{item.cycle_number}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.previous_installment_value)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.new_installment_value
                          ? formatCurrency(item.new_installment_value)
                          : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.requested_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {item.status === "PENDING" && (
                            <>
                              {/* New Cycle Management Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-blue-600 hover:text-blue-700"
                                onClick={() => openRenewDialog(item.client_lot_id, item.client_name || "Cliente")}
                                title="Gerar Próximo Ciclo (12x12)"
                              >
                                <Bell className="h-3.5 w-3.5 mr-1" />
                                Renovar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setApproveTarget(item);
                                  setNewValue(String(item.previous_installment_value));
                                  setApproveNotes("");
                                  setApproveOpen(true);
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setRejectTarget(item);
                                  setRejectNotes("");
                                  setRejectOpen(true);
                                }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Ciclo</DialogTitle>
            <DialogDescription>
              {detail?.client_name} — {detail?.lot_identifier}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Installment Info Card */}
              {installmentInfo && (
                <InstallmentInfoCard 
                  info={installmentInfo}
                  showActions={false}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Ciclo</p>
                  <p className="font-semibold">#{detail.cycle_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(detail.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Anterior</p>
                  <p className="font-semibold">{formatCurrency(detail.previous_installment_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Novo Valor</p>
                  <p className="font-semibold">
                    {detail.new_installment_value
                      ? formatCurrency(detail.new_installment_value)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Solicitado em</p>
                  <p className="text-sm">{formatDate(detail.requested_at)}</p>
                </div>
                {detail.approved_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {detail.status === "APPROVED" ? "Aprovado em" : "Rejeitado em"}
                    </p>
                    <p className="text-sm">{formatDate(detail.approved_at)}</p>
                  </div>
                )}
              </div>
              {detail.adjustment_details && Object.keys(detail.adjustment_details).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Detalhes do Ajuste</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-40">
                    {JSON.stringify(detail.adjustment_details, null, 2)}
                  </pre>
                </div>
              )}
              {detail.admin_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações do Admin</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{detail.admin_notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Ciclo</DialogTitle>
            <DialogDescription>
              {approveTarget?.client_name} — Ciclo #{approveTarget?.cycle_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor anterior:</span>
                <span className="font-semibold">
                  {approveTarget ? formatCurrency(approveTarget.previous_installment_value) : "—"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Novo Valor da Parcela *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Detalhes sobre o ajuste..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApproveOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approving || !newValue}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aprovar Ciclo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Ciclo</DialogTitle>
            <DialogDescription>
              {rejectTarget?.client_name} — Ciclo #{rejectTarget?.cycle_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da Rejeição *</label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Mínimo 5 caracteres..."
              />
              {rejectNotes.length > 0 && rejectNotes.length < 5 && (
                <p className="text-xs text-destructive mt-1">Mínimo 5 caracteres</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejecting || rejectNotes.length < 5}
              >
                {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rejeitar Ciclo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Cycle Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              {renewStep === "prepare" 
                ? `Ciclo ${renewInstallmentInfo?.current_cycle || 1} Completo — ${renewClientName}`
                : `Confirmar Geração do Ciclo ${(renewInstallmentInfo?.current_cycle || 1) + 1}`
              }
            </DialogTitle>
            <DialogDescription>
              {renewStep === "prepare" 
                ? "Defina o percentual de reajuste para o próximo ciclo."
                : "Verifique os dados antes de gerar os boletos."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {renewStep === "prepare" ? (
              <>
                {/* Current Info */}
                {renewInstallmentInfo && (
                  <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcelas restantes:</span>
                      <span className="font-medium">
                        {renewInstallmentInfo.remaining_installments} de {renewInstallmentInfo.total_installments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor atual:</span>
                      <span className="font-medium">
                        {renewInstallmentInfo.current_installment_value 
                          ? formatCurrency(renewInstallmentInfo.current_installment_value)
                          : "—"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Adjustment Rate Input */}
                <div>
                  <label className="text-sm font-medium">Reajuste para o ciclo {renewInstallmentInfo ? renewInstallmentInfo.current_cycle + 1 : 2} (%)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={adjustmentRate}
                      onChange={(e) => setAdjustmentRate(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Real-time calculation */}
                {renewInstallmentInfo?.current_installment_value && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Novo valor estimado: </span>
                      {formatCurrency(
                        renewInstallmentInfo.current_installment_value * 
                        (1 + (parseFloat(adjustmentRate) || 0) / 100)
                      )}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePrepareRenew}
                    disabled={renewLoading}
                  >
                    {renewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Preparar Próximo Ciclo
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Create Step */}
                {prepareResult && (
                  <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Novo valor da parcela:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(prepareResult.new_installment_value)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantidade de boletos:</span>
                      <span className="font-medium">
                        {Math.min(12, prepareResult.remaining_installments)} boletos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Primeiro vencimento:</span>
                      <span className="font-medium">
                        {(() => {
                          const nextDue = new Date();
                          nextDue.setMonth(nextDue.getMonth() + 1);
                          nextDue.setDate(10);
                          return nextDue.toLocaleDateString("pt-BR");
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p className="font-medium">⚠️ Atenção</p>
                  <p className="mt-1">
                    Os boletos serão criados no Sicredi com o valor reajustado. 
                    Esta ação não pode ser desfeita.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setRenewStep("prepare")}>
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCreateBatch}
                    disabled={renewLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {renewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar e Gerar Lote
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
