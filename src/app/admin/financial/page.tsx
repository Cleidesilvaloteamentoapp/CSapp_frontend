"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { DollarSign, AlertTriangle, TrendingUp, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinancialOverview, InvoiceResponse, PaginatedResponse, DefaulterInfo } from "@/types";

const INVOICE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Vencida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

export default function FinancialPage() {
  const [summary, setSummary] = useState<FinancialOverview | null>(null);
  const [receivables, setReceivables] = useState<PaginatedResponse<InvoiceResponse> | null>(null);
  const [defaulters, setDefaulters] = useState<DefaulterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<FinancialOverview>("/admin/financial/summary")
      .then(setSummary)
      .catch(() => {});
    api.get<DefaulterInfo[]>("/admin/financial/defaulters")
      .then(setDefaulters)
      .catch(() => {});
  }, []);

  const loadReceivables = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await api.get<PaginatedResponse<InvoiceResponse>>(`/admin/financial/receivables?${params}`);
      setReceivables(data);
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao carregar recebíveis");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadReceivables(); }, [loadReceivables]);

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Resumo financeiro e contas a receber" />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary ? formatCurrency(summary.total_receivable) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summary ? formatCurrency(summary.total_received) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Atraso</CardTitle>
            <ArrowDownRight className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary ? formatCurrency(summary.total_overdue) : "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.overdue_count ?? 0} faturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplentes</CardTitle>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaulters.length}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="defaulters">Inadimplentes</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Faturas</CardTitle>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Vencidas</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton />
              ) : !receivables || receivables.items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma fatura encontrada</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivables.items.map((inv) => {
                        const status = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">#{inv.installment_number}</TableCell>
                            <TableCell>{formatDate(inv.due_date)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {receivables.pages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground">{receivables.total} fatura{receivables.total !== 1 ? "s" : ""}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                        <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {receivables.pages}</span>
                        <Button variant="outline" size="sm" disabled={page >= receivables.pages} onClick={() => setPage(page + 1)}>Próximo</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaulters" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clientes Inadimplentes</CardTitle>
              <CardDescription>Clientes com faturas vencidas</CardDescription>
            </CardHeader>
            <CardContent>
              {defaulters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum inadimplente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Meses em atraso</TableHead>
                      <TableHead>Valor em atraso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaulters.map((d) => (
                      <TableRow key={d.client_id}>
                        <TableCell className="font-medium">{d.client_name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{d.overdue_months} mes{d.overdue_months !== 1 ? "es" : ""}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-destructive">{formatCurrency(d.overdue_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
