"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ServiceTypeResponse, ServiceOrderResponse, PaginatedResponse } from "@/types";

const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  requested: { label: "Solicitado", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  in_progress: { label: "Em Andamento", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function ServicesPage() {
  const [types, setTypes] = useState<ServiceTypeResponse[]>([]);
  const [orders, setOrders] = useState<PaginatedResponse<ServiceOrderResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [typePrice, setTypePrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ServiceTypeResponse[]>("/admin/services/types").then(setTypes).catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await api.get<PaginatedResponse<ServiceOrderResponse>>(`/admin/services/orders?${params}`);
      setOrders(data);
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao carregar ordens");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function handleCreateType() {
    if (!typeName.trim()) return;
    setSaving(true);
    try {
      await api.post("/admin/services/types", {
        name: typeName, description: typeDesc || undefined,
        base_price: typePrice ? parseFloat(typePrice) : undefined,
      });
      toast.success("Tipo de serviço criado");
      setTypeFormOpen(false);
      setTypeName(""); setTypeDesc(""); setTypePrice("");
      const data = await api.get<ServiceTypeResponse[]>("/admin/services/types");
      setTypes(data);
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    try {
      await api.patch(`/admin/services/orders/${orderId}/status`, { status });
      toast.success("Status atualizado");
      loadOrders();
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao atualizar status");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços" description="Gerencie tipos de serviço e ordens de serviço" />

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="types">Tipos de Serviço</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ordens</CardTitle>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="requested">Solicitadas</SelectItem>
                    <SelectItem value="approved">Aprovadas</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <TableSkeleton /> : !orders || orders.items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma ordem encontrada</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="hidden sm:table-cell">Notas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Custo</TableHead>
                        <TableHead className="hidden md:table-cell">Receita</TableHead>
                        <TableHead className="w-[140px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.items.map((order) => {
                        const st = ORDER_STATUS[order.status] || ORDER_STATUS.requested;
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="text-sm">{formatDate(order.requested_date)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{order.notes || "—"}</TableCell>
                            <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{formatCurrency(order.cost)}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{formatCurrency(order.revenue)}</TableCell>
                            <TableCell>
                              {order.status !== "completed" && order.status !== "cancelled" && (
                                <Select onValueChange={(v) => handleStatusChange(order.id, v)}>
                                  <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Alterar..." /></SelectTrigger>
                                  <SelectContent>
                                    {order.status === "requested" && <SelectItem value="approved">Aprovar</SelectItem>}
                                    {(order.status === "approved" || order.status === "requested") && <SelectItem value="in_progress">Iniciar</SelectItem>}
                                    {order.status === "in_progress" && <SelectItem value="completed">Concluir</SelectItem>}
                                    <SelectItem value="cancelled">Cancelar</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {orders.pages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground">{orders.total} ordem(ns)</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                        <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {orders.pages}</span>
                        <Button variant="outline" size="sm" disabled={page >= orders.pages} onClick={() => setPage(page + 1)}>Próximo</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Tipos de Serviço</CardTitle>
                  <CardDescription>Serviços oferecidos aos clientes</CardDescription>
                </div>
                <Button size="sm" onClick={() => setTypeFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {types.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum tipo de serviço cadastrado</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {types.map((t) => (
                    <div key={t.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{t.name}</p>
                        <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Ativo" : "Inativo"}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                      <p className="text-sm font-semibold mt-2">{formatCurrency(t.base_price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={typeFormOpen} onOpenChange={setTypeFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Serviço</DialogTitle>
            <DialogDescription>Defina um novo serviço disponível para os clientes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Nome</label><Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="Ex: Limpeza de terreno" className="mt-1" /></div>
            <div><label className="text-sm font-medium">Descrição</label><Input value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} placeholder="Opcional" className="mt-1" /></div>
            <div><label className="text-sm font-medium">Preço Base (R$)</label><Input type="number" step="0.01" value={typePrice} onChange={(e) => setTypePrice(e.target.value)} placeholder="0.00" className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTypeFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateType} disabled={saving || !typeName.trim()}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
