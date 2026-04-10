"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import {
  listEconomicIndices,
  createEconomicIndex,
  updateEconomicIndex,
  deleteEconomicIndex,
} from "@/services/admin";
import type { EconomicIndexResponse, IndexType } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { PermissionGuard } from "@/components/shared/permission-guard";

const INDEX_TYPE_LABELS: Record<IndexType, string> = {
  IPCA: "IPCA",
  IGPM: "IGP-M",
  CUB: "CUB",
  INPC: "INPC",
};

const INDEX_TYPE_COLORS: Record<IndexType, string> = {
  IPCA: "bg-blue-100 text-blue-700",
  IGPM: "bg-green-100 text-green-700",
  CUB: "bg-orange-100 text-orange-700",
  INPC: "bg-purple-100 text-purple-700",
};

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export default function EconomicIndicesPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [indices, setIndices] = useState<EconomicIndexResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isSuperAdmin, router]);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUf, setFilterUf] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [formType, setFormType] = useState<IndexType>("IPCA");
  const [formMonth, setFormMonth] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUf, setFormUf] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<EconomicIndexResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== "all") params.index_type = filterType;
      if (filterUf.trim()) params.state_code = filterUf.trim().toUpperCase();
      if (filterStart) params.start_month = filterStart;
      if (filterEnd) params.end_month = filterEnd;
      const data = await listEconomicIndices(params);
      setIndices(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao carregar índices");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterUf, filterStart, filterEnd]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!formMonth || formValue === "") return;
    setSaving(true);
    try {
      await createEconomicIndex({
        index_type: formType,
        reference_month: formMonth,
        value: parseFloat(formValue),
        state_code: formType === "CUB" && formUf ? formUf : undefined,
      });
      toast.success("Índice criado com sucesso");
      setCreateOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(typeof err.detail === "string" ? err.detail : "Erro ao criar índice");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleInlineEdit(id: string) {
    if (!editValue) return;
    setEditSaving(true);
    try {
      await updateEconomicIndex(id, { value: parseFloat(editValue) });
      toast.success("Valor atualizado");
      setEditId(null);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao atualizar");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEconomicIndex(deleteTarget.id);
      toast.success("Índice excluído");
      setDeleteOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) toast.error("Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  function resetForm() {
    setFormType("IPCA");
    setFormMonth("");
    setFormValue("");
    setFormUf("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Índices Econômicos" description="Gerencie os índices de correção monetária">
        <PermissionGuard permission="manage_financial_settings">
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Índice
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGPM">IGP-M</SelectItem>
                <SelectItem value="CUB">CUB</SelectItem>
                <SelectItem value="INPC">INPC</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="UF (ex: SP)"
              value={filterUf}
              onChange={(e) => setFilterUf(e.target.value)}
              maxLength={2}
            />
            <Input
              type="month"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              placeholder="Mês início"
            />
            <Input
              type="month"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              placeholder="Mês fim"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Índices {indices.length > 0 && `(${indices.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : indices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhum índice encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mês Referência</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Valor %</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indices.map((idx) => (
                    <TableRow key={idx.id}>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${INDEX_TYPE_COLORS[idx.index_type]}`}>
                          {INDEX_TYPE_LABELS[idx.index_type]}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {idx.reference_month}
                      </TableCell>
                      <TableCell>
                        {idx.state_code || "—"}
                      </TableCell>
                      <TableCell>
                        {editId === idx.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-24"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleInlineEdit(idx.id)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => handleInlineEdit(idx.id)}
                              disabled={editSaving}
                            >
                              {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "✓"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => setEditId(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:underline font-semibold"
                            onClick={() => {
                              setEditId(idx.id);
                              setEditValue(String(idx.value));
                            }}
                          >
                            {idx.value.toFixed(4)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={idx.source === "MANUAL" ? "outline" : "secondary"}>
                          {idx.source === "MANUAL" ? "Manual" : "BCB API"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(idx.created_at)}
                      </TableCell>
                      <TableCell>
                        <PermissionGuard permission="manage_financial_settings">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditId(idx.id);
                                setEditValue(String(idx.value));
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteTarget(idx);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </PermissionGuard>
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
            <DialogTitle>Novo Índice Econômico</DialogTitle>
            <DialogDescription>Adicione um novo índice de correção monetária manualmente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo do Índice</label>
              <Select value={formType} onValueChange={(v) => setFormType(v as IndexType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                  <SelectItem value="IGPM">IGP-M</SelectItem>
                  <SelectItem value="CUB">CUB</SelectItem>
                  <SelectItem value="INPC">INPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Mês de Referência</label>
              <Input
                type="month"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                className="mt-1"
              />
            </div>
            {formType === "CUB" && (
              <div>
                <label className="text-sm font-medium">UF (Estado)</label>
                <Select value={formUf} onValueChange={setFormUf}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Valor (%)</label>
              <Input
                type="number"
                step="0.0001"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="0.4500"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formMonth || formValue === ""}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Índice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Índice"
        description={`Tem certeza que deseja excluir o índice ${deleteTarget?.index_type} de ${deleteTarget?.reference_month}?`}
        confirmLabel="Excluir"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
