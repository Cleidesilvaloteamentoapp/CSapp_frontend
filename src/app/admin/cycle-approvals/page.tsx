"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  FileSignature,
  Info,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { listCycleApprovals, rejectCycle } from "@/services/admin";
import type { CycleApprovalResponse, CycleApprovalStatus } from "@/types";
import { WORKFLOW_STATUS_CONFIG } from "@/types";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ApproveCycleDialog } from "./_components/approve-dialog";
import { DeedChecklistDialog } from "./_components/deed-checklist-dialog";
import { FinalCycleBadge, SettlementBadge } from "./_components/settlement-badge";

export default function CycleApprovalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters live in the URL so the dashboard can deep-link straight to the
  // rows it is counting, and so a reload keeps the admin where they were.
  const statusFilter = searchParams.get("status") ?? "PENDING";
  const finalOnly = searchParams.get("final") === "1";

  const [approvals, setApprovals] = useState<CycleApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const [approveTarget, setApproveTarget] = useState<CycleApprovalResponse | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<CycleApprovalResponse | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [deedTarget, setDeedTarget] = useState<CycleApprovalResponse | null>(null);
  const [deedOpen, setDeedOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setApprovals(await listCycleApprovals({ status: statusFilter }));
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao carregar as renovações"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    router.replace(`?${next.toString()}`);
  }

  async function handleReject() {
    if (!rejectTarget || rejectNotes.length < 5) return;
    setRejecting(true);
    try {
      await rejectCycle(rejectTarget.id, { admin_notes: rejectNotes });
      toast.success("Renovação rejeitada");
      setRejectOpen(false);
      setRejectNotes("");
      loadData();
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao rejeitar"
      );
    } finally {
      setRejecting(false);
    }
  }

  const visible = finalOnly ? approvals.filter((a) => a.is_final_cycle) : approvals;
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;
  const blockedCount = approvals.filter(
    (a) => a.status === "PENDING" && !a.can_approve
  ).length;
  const finalCount = approvals.filter(
    (a) => a.status === "PENDING" && a.is_final_cycle
  ).length;

  function statusBadge(status: CycleApprovalStatus) {
    const cfg = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.PENDING;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  }

  return (
    <PermissionGuard permission="manage_financial">
      <div className="space-y-6">
        <PageHeader
          title="Renovação de ciclos"
          description="Libere os próximos boletos de cada contrato, com o reajuste do período"
        >
          <Button variant="outline" size="sm" onClick={() => setShowHelp((v) => !v)}>
            <Info className="mr-2 h-4 w-4" />
            Como funciona
          </Button>
        </PageHeader>

        {showHelp && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como funciona o ciclo</CardTitle>
              <CardDescription>
                O contrato é cobrado em ciclos de até 12 parcelas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. O sistema avisa com antecedência.</strong>{" "}
                Cerca de 45 dias antes do vencimento da última parcela do ciclo, a
                renovação aparece aqui e o menu mostra o contador.
              </p>
              <p>
                <strong className="text-foreground">2. Você revisa o reajuste.</strong> O
                valor sugerido já vem calculado pelo índice do contrato mais a taxa
                fixa. Dá para editar antes de liberar.
              </p>
              <p>
                <strong className="text-foreground">3. Aprovar gera os boletos.</strong> As
                próximas parcelas são criadas e enviadas para registro no banco.
              </p>
              <p>
                <strong className="text-foreground">4. Parcela em aberto trava a aprovação.</strong>{" "}
                Se o ciclo anterior não foi todo liquidado, use{" "}
                <strong className="text-foreground">Renovar agora</strong>: libera mesmo
                assim, mediante justificativa, e fica registrado no histórico.
              </p>
              <p>
                <strong className="text-foreground">5. Último ciclo inicia a escrituração.</strong>{" "}
                Quando restam 12 parcelas ou menos, o contrato é marcado como último
                ciclo e o checklist de documentos é aberto.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Aguardando sua decisão</p>
            </CardContent>
          </Card>
          <Card className={blockedCount > 0 ? "border-destructive/40" : undefined}>
            <CardContent className="p-4">
              <p
                className={`text-2xl font-bold ${blockedCount > 0 ? "text-destructive" : ""}`}
              >
                {blockedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Com parcela em aberto — exigem &quot;Renovar agora&quot;
              </p>
            </CardContent>
          </Card>
          <Card className={finalCount > 0 ? "border-amber-300" : undefined}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${finalCount > 0 ? "text-amber-600" : ""}`}>
                {finalCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Último ciclo — iniciar escrituração
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setParam("status", v)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="APPROVED">Aprovados</SelectItem>
              <SelectItem value="REJECTED">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={finalOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setParam("final", finalOnly ? null : "1")}
          >
            <FileSignature className="mr-2 h-4 w-4" />
            Só último ciclo
          </Button>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} />
              </div>
            ) : visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma renovação {statusFilter === "PENDING" ? "pendente" : "nesta situação"}.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Quitação do ciclo anterior</TableHead>
                    <TableHead className="text-right">Valor atual</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.client_name ?? "—"}
                          {item.is_final_cycle && <FinalCycleBadge />}
                        </div>
                        {item.forced && (
                          <p className="mt-0.5 text-[11px] text-destructive">
                            Renovado com pendência
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lot_identifier ?? "—"}
                      </TableCell>
                      <TableCell>#{item.cycle_number}</TableCell>
                      <TableCell>
                        <SettlementBadge item={item} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.previous_installment_value)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {statusBadge(item.status)}
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(item.requested_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.is_final_cycle && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDeedTarget(item);
                                setDeedOpen(true);
                              }}
                            >
                              <FileSignature className="mr-1 h-4 w-4" />
                              Escrituração
                            </Button>
                          )}
                          {item.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className={
                                  item.can_approve
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-destructive hover:bg-destructive/90"
                                }
                                onClick={() => {
                                  setApproveTarget(item);
                                  setApproveOpen(true);
                                }}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                {item.can_approve ? "Aprovar" : "Renovar agora"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectTarget(item);
                                  setRejectNotes("");
                                  setRejectOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ApproveCycleDialog
          target={approveTarget}
          open={approveOpen}
          onOpenChange={setApproveOpen}
          onDone={loadData}
        />

        <DeedChecklistDialog
          clientLotId={deedTarget?.client_lot_id ?? null}
          clientName={deedTarget?.client_name ?? ""}
          open={deedOpen}
          onOpenChange={setDeedOpen}
        />

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar renovação</DialogTitle>
              <DialogDescription>
                {rejectTarget?.client_name} — Ciclo #{rejectTarget?.cycle_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                Rejeitar não gera parcelas nem boletos. O contrato fica sem cobrança
                até que uma nova renovação seja aberta.
              </p>
              <div>
                <label className="text-sm font-medium">Motivo da rejeição *</label>
                <Textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="Mínimo 5 caracteres..."
                />
                {rejectNotes.length > 0 && rejectNotes.length < 5 && (
                  <p className="mt-1 text-xs text-destructive">Mínimo 5 caracteres</p>
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
                  Rejeitar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
