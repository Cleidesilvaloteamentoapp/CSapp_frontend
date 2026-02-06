"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { lotCreateSchema, lotAssignSchema, type LotCreateFormData, type LotAssignFormData } from "@/lib/validators";
import { formatCurrency, formatArea } from "@/lib/format";
import type { LotResponse, PaginatedResponse, DevelopmentResponse, ClientResponse } from "@/types";

const LOT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Disponível", variant: "default" },
  reserved: { label: "Reservado", variant: "outline" },
  sold: { label: "Vendido", variant: "secondary" },
};

export default function LotsPage() {
  const [lots, setLots] = useState<PaginatedResponse<LotResponse> | null>(null);
  const [developments, setDevelopments] = useState<DevelopmentResponse[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [devFilter, setDevFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LotResponse | null>(null);

  const createForm = useForm<LotCreateFormData>({
    resolver: zodResolver(lotCreateSchema) as never,
    defaultValues: { development_id: "", lot_number: "", block: "", area_m2: 0, price: 0 },
  });

  const assignForm = useForm<LotAssignFormData>({
    resolver: zodResolver(lotAssignSchema) as never,
    defaultValues: {
      client_id: "", lot_id: "", purchase_date: "", total_value: 0,
      payment_plan: { installments: 12, first_due: "" },
    },
  });

  const loadLots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (devFilter !== "all") params.set("development_id", devFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await api.get<PaginatedResponse<LotResponse>>(`/admin/lots/?${params}`);
      setLots(data);
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao carregar lotes");
    } finally {
      setLoading(false);
    }
  }, [page, devFilter, statusFilter]);

  useEffect(() => {
    Promise.all([
      api.get<DevelopmentResponse[]>("/admin/developments/").catch(() => []),
      api.get<PaginatedResponse<ClientResponse>>("/admin/clients/?per_page=50&status=active").catch(() => ({ items: [] })),
    ]).then(([devs, cls]) => {
      setDevelopments(devs);
      setClients((cls as PaginatedResponse<ClientResponse>).items || []);
    });
  }, []);

  useEffect(() => { loadLots(); }, [loadLots]);

  async function onCreateSubmit(data: LotCreateFormData) {
    try {
      await api.post("/admin/lots/", data);
      toast.success("Lote criado com sucesso");
      setCreateOpen(false);
      createForm.reset();
      loadLots();
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao criar lote");
    }
  }

  function openAssign(lot: LotResponse) {
    setSelectedLot(lot);
    assignForm.reset({
      client_id: "", lot_id: lot.id, purchase_date: new Date().toISOString().split("T")[0],
      total_value: parseFloat(lot.price),
      payment_plan: { installments: 12, first_due: "" },
    });
    setAssignOpen(true);
  }

  async function onAssignSubmit(data: LotAssignFormData) {
    try {
      await api.post("/admin/lots/assign", data);
      toast.success("Lote vendido com sucesso! Faturas geradas automaticamente.");
      setAssignOpen(false);
      loadLots();
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao vender lote");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lotes" description="Gerencie os lotes dos empreendimentos">
        <Button onClick={() => { createForm.reset(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Lote
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={devFilter} onValueChange={(v) => { setDevFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Empreendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos empreendimentos</SelectItem>
            {developments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="available">Disponíveis</SelectItem>
            <SelectItem value="reserved">Reservados</SelectItem>
            <SelectItem value="sold">Vendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : !lots || lots.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nenhum lote encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Cadastrar lote
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Quadra</TableHead>
                    <TableHead className="hidden sm:table-cell">Área</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.items.map((lot) => {
                    const status = LOT_STATUS[lot.status] || LOT_STATUS.available;
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{lot.lot_number}</TableCell>
                        <TableCell>{lot.block || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatArea(lot.area_m2)}</TableCell>
                        <TableCell>{formatCurrency(lot.price)}</TableCell>
                        <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                        <TableCell>
                          {lot.status === "available" && (
                            <Button variant="ghost" size="sm" onClick={() => openAssign(lot)} title="Vender lote">
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {lots.pages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">{lots.total} lote{lots.total !== 1 ? "s" : ""}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {lots.pages}</span>
                    <Button variant="outline" size="sm" disabled={page >= lots.pages} onClick={() => setPage(page + 1)}>Próximo</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Lot Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lote</DialogTitle>
            <DialogDescription>Cadastre um novo lote em um empreendimento</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField control={createForm.control} name="development_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {developments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={createForm.control} name="lot_number" render={({ field }) => (
                  <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="block" render={({ field }) => (
                  <FormItem><FormLabel>Quadra</FormLabel><FormControl><Input placeholder="A" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={createForm.control} name="area_m2" render={({ field }) => (
                  <FormItem><FormLabel>Área (m²)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar Lote"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign (Sell) Lot Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vender Lote {selectedLot?.lot_number}</DialogTitle>
            <DialogDescription>Associe este lote a um cliente e defina o plano de pagamento</DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField control={assignForm.control} name="client_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={assignForm.control} name="purchase_date" render={({ field }) => (
                  <FormItem><FormLabel>Data da Compra</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={assignForm.control} name="total_value" render={({ field }) => (
                  <FormItem><FormLabel>Valor Total (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Plano de Pagamento</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={assignForm.control} name="payment_plan.installments" render={({ field }) => (
                    <FormItem><FormLabel>Parcelas</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={assignForm.control} name="payment_plan.first_due" render={({ field }) => (
                    <FormItem><FormLabel>Primeiro Vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={assignForm.formState.isSubmitting} className="bg-success hover:bg-success/90">
                  {assignForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : "Confirmar Venda"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
