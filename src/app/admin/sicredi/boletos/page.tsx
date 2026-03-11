"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Layers,
  X,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { BoletoStatsCards } from "@/components/sicredi/boleto-stats-cards";
import { BoletoActionsMenu } from "@/components/sicredi/boleto-actions-menu";
import type { ActionType } from "@/components/sicredi/boleto-actions-menu";
import { ClientSelector } from "@/components/sicredi/client-selector";
import { ClientFormDialog } from "@/app/admin/clients/client-form-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { updateBoleto } from "@/services/sicredi";
import { formatCurrency, formatDate, formatCpfCnpj } from "@/lib/format";
import type {
  Boleto,
  BoletoStats,
  BoletoSituacao,
  BoletoListFilters,
  STATUS_CONFIG,
} from "@/types/sicredi";
import { STATUS_CONFIG as StatusConfig, BATCH_ACTION_LABELS } from "@/types/sicredi";
import type { ClientResponse } from "@/types";

export default function BoletosListPage() {
  const router = useRouter();
  const {
    cancel,
    downloadPdf,
    loadLocalBoletos,
    loadStats,
    negativar,
    sustarNegativacao,
    updateVencimento,
    updateDesconto,
    updateJuros,
    updateSeuNumero,
    grantAbatimento,
    revokeAbatimento,
    loading,
  } = useSicrediBoletos();

  // Data
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [stats, setStats] = useState<BoletoStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BoletoSituacao | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [clientFilterName, setClientFilterName] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Loading
  const [pageLoading, setPageLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialogs
  const [cancelTarget, setCancelTarget] = useState<Boleto | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Inline action dialogs
  const [actionBoleto, setActionBoleto] = useState<Boleto | null>(null);
  const [vencimentoOpen, setVencimentoOpen] = useState(false);
  const [jurosOpen, setJurosOpen] = useState(false);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [abatimentoOpen, setAbatimentoOpen] = useState(false);
  const [seuNumeroOpen, setSeuNumeroOpen] = useState(false);
  const [negativarOpen, setNegativarOpen] = useState(false);
  const [sustarOpen, setSustarOpen] = useState(false);
  const [linkClientOpen, setLinkClientOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form values
  const [newVencimento, setNewVencimento] = useState("");
  const [newJuros, setNewJuros] = useState("");
  const [newDesconto, setNewDesconto] = useState("");
  const [newAbatimento, setNewAbatimento] = useState("");
  const [newSeuNumero, setNewSeuNumero] = useState("");

  // Client selector for filter
  const [clientSelectorOpen, setClientSelectorOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  // Selection for batch
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ==================== Data Loading ====================

  const loadData = useCallback(async () => {
    setPageLoading(true);
    const filters: BoletoListFilters = {
      page,
      per_page: perPage,
    };
    if (statusFilter) filters.status = statusFilter;
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (dateStart) filters.data_inicio = dateStart;
    if (dateEnd) filters.data_fim = dateEnd;
    if (clientFilter) filters.client_id = clientFilter;

    const result = await loadLocalBoletos(filters);
    if (result) {
      // Handle both array and paginated response formats
      const isArray = Array.isArray(result);
      const items = isArray ? result : (result.items || []);
      const total = isArray ? result.length : (result.total || 0);
      
      setBoletos(items);
      setTotalCount(total);
    } else {
    }
    setPageLoading(false);
  }, [page, statusFilter, searchTerm, dateStart, dateEnd, clientFilter]);

  const loadStatsData = useCallback(async () => {
    setStatsLoading(true);
    const data = await loadStats();
    setStats(data);
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadStatsData();
  }, [loadStatsData]);

  const refresh = useCallback(() => {
    loadData();
    loadStatsData();
    setSelectedIds(new Set());
  }, [loadData, loadStatsData]);

  // ==================== Filter Handlers ====================

  function handleStatusFilterFromCard(status: BoletoSituacao | null) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleSearch() {
    setPage(1);
    loadData();
  }

  function clearFilters() {
    setStatusFilter(null);
    setSearchTerm("");
    setDateStart("");
    setDateEnd("");
    setClientFilter(null);
    setClientFilterName("");
    setPage(1);
  }

  const hasActiveFilters = statusFilter || searchTerm || dateStart || dateEnd || clientFilter;

  // ==================== Selection ====================

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === boletos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(boletos.map((b) => b.id)));
    }
  }

  // ==================== Action Handlers ====================

  function handleAction(action: ActionType, boleto: Boleto) {
    setActionBoleto(boleto);
    switch (action) {
      case "view":
        router.push(`/admin/sicredi/boletos/${boleto.nosso_numero}`);
        break;
      case "pdf":
        downloadPdf(boleto.linha_digitavel, `boleto_${boleto.nosso_numero}.pdf`);
        break;
      case "cancel":
        setCancelTarget(boleto);
        setCancelConfirmOpen(true);
        break;
      case "vencimento":
        setNewVencimento("");
        setVencimentoOpen(true);
        break;
      case "juros":
        setNewJuros("");
        setJurosOpen(true);
        break;
      case "desconto":
        setNewDesconto("");
        setDescontoOpen(true);
        break;
      case "abatimento":
        setNewAbatimento("");
        setAbatimentoOpen(true);
        break;
      case "cancelar_abatimento":
        handleRevokeAbatimento(boleto);
        break;
      case "seu_numero":
        setNewSeuNumero(boleto.seu_numero);
        setSeuNumeroOpen(true);
        break;
      case "negativar":
        setNegativarOpen(true);
        break;
      case "sustar_negativacao":
        setSustarOpen(true);
        break;
      case "link_client":
        setLinkClientOpen(true);
        break;
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    const success = await cancel(cancelTarget.nosso_numero);
    setCancelling(false);
    setCancelConfirmOpen(false);
    setCancelTarget(null);
    if (success) {
      toast.success("Boleto cancelado com sucesso");
      refresh();
    } else {
      toast.error("Erro ao cancelar boleto");
    }
  }

  async function handleRevokeAbatimento(boleto: Boleto) {
    setActionLoading(true);
    const success = await revokeAbatimento(boleto.nosso_numero);
    setActionLoading(false);
    if (success) toast.success("Abatimento cancelado");
    else toast.error("Erro ao cancelar abatimento");
  }

  async function handleUpdateVencimento() {
    if (!actionBoleto || !newVencimento) return;
    setActionLoading(true);
    const success = await updateVencimento(actionBoleto.nosso_numero, {
      data_vencimento: newVencimento,
    });
    setActionLoading(false);
    setVencimentoOpen(false);
    if (success) {
      toast.success("Vencimento alterado");
      refresh();
    } else {
      toast.error("Erro ao alterar vencimento");
    }
  }

  async function handleUpdateJuros() {
    if (!actionBoleto || !newJuros) return;
    setActionLoading(true);
    const success = await updateJuros(actionBoleto.nosso_numero, {
      valor_ou_percentual: newJuros,
    });
    setActionLoading(false);
    setJurosOpen(false);
    if (success) {
      toast.success("Juros alterados");
      refresh();
    } else {
      toast.error("Erro ao alterar juros");
    }
  }

  async function handleUpdateDesconto() {
    if (!actionBoleto) return;
    setActionLoading(true);
    const success = await updateDesconto(actionBoleto.nosso_numero, {
      valor_desconto_1: newDesconto ? parseFloat(newDesconto) : null,
    });
    setActionLoading(false);
    setDescontoOpen(false);
    if (success) {
      toast.success("Desconto alterado");
      refresh();
    } else {
      toast.error("Erro ao alterar desconto");
    }
  }

  async function handleGrantAbatimento() {
    if (!actionBoleto || !newAbatimento) return;
    setActionLoading(true);
    const success = await grantAbatimento(actionBoleto.nosso_numero, {
      valor_abatimento: parseFloat(newAbatimento),
    });
    setActionLoading(false);
    setAbatimentoOpen(false);
    if (success) {
      toast.success("Abatimento concedido");
      refresh();
    } else {
      toast.error("Erro ao conceder abatimento");
    }
  }

  async function handleUpdateSeuNumero() {
    if (!actionBoleto || !newSeuNumero) return;
    setActionLoading(true);
    const success = await updateSeuNumero(actionBoleto.nosso_numero, {
      seu_numero: newSeuNumero,
    });
    setActionLoading(false);
    setSeuNumeroOpen(false);
    if (success) {
      toast.success("Seu Número alterado");
      refresh();
    } else {
      toast.error("Erro ao alterar Seu Número");
    }
  }

  async function handleNegativar() {
    if (!actionBoleto) return;
    setActionLoading(true);
    const success = await negativar(actionBoleto.nosso_numero);
    setActionLoading(false);
    setNegativarOpen(false);
    if (success) {
      toast.success("Negativação incluída");
      refresh();
    } else {
      toast.error("Erro ao incluir negativação");
    }
  }

  async function handleSustarNegativacao() {
    if (!actionBoleto) return;
    setActionLoading(true);
    const success = await sustarNegativacao(actionBoleto.nosso_numero);
    setActionLoading(false);
    setSustarOpen(false);
    if (success) {
      toast.success("Negativação sustada e boleto baixado");
      refresh();
    } else {
      toast.error("Erro ao sustar negativação");
    }
  }

  async function handleLinkClient(clientId: string) {
    if (!actionBoleto) return;
    setActionLoading(true);
    try {
      await updateBoleto(actionBoleto.id, { client_id: clientId });
      toast.success("Cliente vinculado ao boleto");
      setLinkClientOpen(false);
      refresh();
    } catch {
      toast.error("Erro ao vincular cliente");
    } finally {
      setActionLoading(false);
    }
  }

  // ==================== Pagination ====================

  const totalPages = Math.ceil(totalCount / perPage);

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Central de Boletos"
          description="Gerencie todos os boletos emitidos via Sicredi"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={pageLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${pageLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/sicredi/boletos/batch")}
          >
            <Layers className="mr-2 h-4 w-4" />
            Criar em Lote
          </Button>
          <Button onClick={() => router.push("/admin/sicredi/boletos/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Boleto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <BoletoStatsCards
        stats={stats}
        loading={statsLoading}
        activeFilter={statusFilter}
        onFilterClick={handleStatusFilterFromCard}
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por Nosso Nº, Seu Nº, pagador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? null : (v as BoletoSituacao));
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="NORMAL">Em Aberto</SelectItem>
                <SelectItem value="LIQUIDADO">Liquidados</SelectItem>
                <SelectItem value="VENCIDO">Vencidos</SelectItem>
                <SelectItem value="CANCELADO">Cancelados</SelectItem>
                <SelectItem value="NEGATIVADO">Negativados</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Data início"
              value={dateStart}
              onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              placeholder="Data fim"
              value={dateEnd}
              onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2 mt-3">
            {clientFilter ? (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {clientFilterName || "Cliente selecionado"}
                <button
                  onClick={() => { setClientFilter(null); setClientFilterName(""); setPage(1); }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientSelectorOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Filtrar por Cliente
              </Button>
            )}
            <Button size="sm" onClick={handleSearch} disabled={pageLoading}>
              {pageLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Boletos {totalCount > 0 && `(${totalCount})`}
            </CardTitle>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedIds.size} selecionado(s)</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar seleção
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pageLoading ? (
            <TableSkeleton />
          ) : boletos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm font-medium mb-1">
                Nenhum boleto encontrado
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                {hasActiveFilters
                  ? "Tente ajustar os filtros de busca"
                  : "Crie seu primeiro boleto para começar"}
              </p>
              {!hasActiveFilters && (
                <Button
                  size="sm"
                  onClick={() => router.push("/admin/sicredi/boletos/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Boleto
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === boletos.length && boletos.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Nosso Nº</TableHead>
                      <TableHead>Cliente / Pagador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boletos.map((boleto) => {
                      const cfg = StatusConfig[boleto.status] || StatusConfig.NORMAL;
                      return (
                        <TableRow
                          key={boleto.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/admin/sicredi/boletos/${boleto.nosso_numero}`)
                          }
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(boleto.id)}
                              onChange={() => toggleSelect(boleto.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-mono text-sm font-medium">
                                {boleto.nosso_numero}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {boleto.seu_numero}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {boleto.client ? (
                                <>
                                  <p className="text-sm font-medium">
                                    {boleto.client.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCpfCnpj(boleto.client.cpf_cnpj)}
                                  </p>
                                </>
                              ) : boleto.pagador_nome && boleto.pagador_documento ? (
                                <>
                                  <p className="text-sm font-medium">
                                    {boleto.pagador_nome}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCpfCnpj(boleto.pagador_documento)}
                                    {!boleto.client_id && (
                                      <span className="ml-1 text-yellow-600">(sem cliente)</span>
                                    )}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sem dados de pagador</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            {formatCurrency(boleto.valor)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(boleto.data_vencimento)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <BoletoActionsMenu
                              boleto={boleto}
                              onAction={handleAction}
                              disabled={loading}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ==================== Dialogs ==================== */}

      {/* Cancel Confirmation */}
      <ConfirmationDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancelar Boleto"
        description={`Tem certeza que deseja cancelar (dar baixa) no boleto ${cancelTarget?.nosso_numero}? Esta ação será enviada ao banco Sicredi e não pode ser desfeita.`}
        confirmLabel="Sim, Cancelar Boleto"
        destructive
        loading={cancelling}
        onConfirm={handleConfirmCancel}
      />

      {/* Alterar Vencimento */}
      <Dialog open={vencimentoOpen} onOpenChange={setVencimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Data de Vencimento</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nova Data de Vencimento</label>
              <Input
                type="date"
                value={newVencimento}
                onChange={(e) => setNewVencimento(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVencimentoOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateVencimento}
                disabled={actionLoading || !newVencimento}
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alterar Juros */}
      <Dialog open={jurosOpen} onOpenChange={setJurosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Juros</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor ou Percentual</label>
              <Input
                type="text"
                value={newJuros}
                onChange={(e) => setNewJuros(e.target.value)}
                placeholder="2.50"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setJurosOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateJuros}
                disabled={actionLoading || !newJuros}
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alterar Desconto */}
      <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Desconto</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero}. Deixe vazio para remover.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor do Desconto (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newDesconto}
                onChange={(e) => setNewDesconto(e.target.value)}
                placeholder="10.00"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDescontoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDesconto} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conceder Abatimento */}
      <Dialog open={abatimentoOpen} onOpenChange={setAbatimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Abatimento</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor do Abatimento (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={newAbatimento}
                onChange={(e) => setNewAbatimento(e.target.value)}
                placeholder="5.00"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAbatimentoOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGrantAbatimento}
                disabled={actionLoading || !newAbatimento}
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alterar Seu Número */}
      <Dialog open={seuNumeroOpen} onOpenChange={setSeuNumeroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Seu Número</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Novo Seu Número</label>
              <Input
                value={newSeuNumero}
                onChange={(e) => setNewSeuNumero(e.target.value)}
                placeholder="INV-12345"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSeuNumeroOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateSeuNumero}
                disabled={actionLoading || !newSeuNumero}
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Negativação */}
      <ConfirmationDialog
        open={negativarOpen}
        onOpenChange={setNegativarOpen}
        title="Incluir Negativação"
        description={`Tem certeza que deseja incluir negativação para o boleto ${actionBoleto?.nosso_numero}? O pagador será registrado nos órgãos de proteção ao crédito.`}
        confirmLabel="Sim, Negativar"
        destructive
        loading={actionLoading}
        onConfirm={handleNegativar}
      />

      {/* Sustar Negativação */}
      <ConfirmationDialog
        open={sustarOpen}
        onOpenChange={setSustarOpen}
        title="Sustar Negativação e Baixar Título"
        description={`Tem certeza que deseja sustar a negativação e dar baixa no boleto ${actionBoleto?.nosso_numero}?`}
        confirmLabel="Sim, Sustar e Baixar"
        destructive
        loading={actionLoading}
        onConfirm={handleSustarNegativacao}
      />

      {/* Link Client Dialog */}
      <Dialog open={linkClientOpen} onOpenChange={setLinkClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Cliente ao Boleto</DialogTitle>
            <DialogDescription>
              Boleto: {actionBoleto?.nosso_numero} — Pagador: {actionBoleto?.pagador_nome}
            </DialogDescription>
          </DialogHeader>
          <ClientSelector
            value={null}
            onChange={(clientId) => handleLinkClient(clientId)}
            onCreateNew={() => {
              setLinkClientOpen(false);
              setClientFormOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Client Selector for Filter */}
      <Dialog open={clientSelectorOpen} onOpenChange={setClientSelectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Cliente</DialogTitle>
            <DialogDescription>
              Selecione um cliente para filtrar os boletos
            </DialogDescription>
          </DialogHeader>
          <ClientSelector
            value={clientFilter}
            onChange={(clientId, clientData) => {
              setClientFilter(clientId);
              setClientFilterName(clientData.full_name);
              setClientSelectorOpen(false);
              setPage(1);
            }}
            onCreateNew={() => {
              setClientSelectorOpen(false);
              setClientFormOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Client Form Dialog */}
      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        client={null}
        onSuccess={() => {
          setClientFormOpen(false);
          toast.success("Cliente criado com sucesso");
        }}
      />
    </div>
  );
}
