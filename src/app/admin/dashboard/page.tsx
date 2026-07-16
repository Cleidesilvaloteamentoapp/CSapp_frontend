"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  LandPlot,
  DollarSign,
  Wrench,
  AlertTriangle,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  UserPlus,
  FileSignature,
  Handshake,
  UserX,
  CalendarClock,
  Clock,
  FileText,
  Receipt,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatCpfCnpj, formatPhone } from "@/lib/format";
import type { AdminStats, FinancialOverview, RevenueChart, RecentActivity, DefaulterDetail } from "@/types";
import { listDashboardDefaulters } from "@/services/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/** Compact clickable KPI tile used in the client-control command row. */
function QuickStat({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent = "text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  href: string;
  accent?: string;
}) {
  return (
    <Link href={href} className="transition-transform hover:scale-[1.02]">
      <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-2xl font-bold leading-tight ${accent}`}>{value}</div>
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            {hint && <p className="text-[11px] text-muted-foreground/80 truncate">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Pick an icon for a recent-activity row based on its type label. */
function activityIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("cliente")) return Users;
  if (t.includes("contrato") || t.includes("transfer")) return FileSignature;
  if (t.includes("fatura")) return FileText;
  if (t.includes("boleto")) return Receipt;
  if (t.includes("distrato") || t.includes("renegocia")) return Handshake;
  if (t.includes("documento")) return FileText;
  return ActivityIcon;
}

/** Short relative time like "há 5 min" / "há 2 h" / "há 3 d". */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} d`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueChart[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Defaulters drill-down
  const [defaultersOpen, setDefaultersOpen] = useState(false);
  const [defaulters, setDefaulters] = useState<DefaulterDetail[]>([]);
  const [defaultersLoading, setDefaultersLoading] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, financialData, revenueData, activitiesData] = await Promise.all([
          api.get<AdminStats>("/admin/dashboard/stats"),
          api.get<FinancialOverview>("/admin/dashboard/financial-overview"),
          api.get<RevenueChart[]>("/admin/dashboard/charts/revenue?months=6"),
          api.get<RecentActivity[]>("/admin/dashboard/recent-activities?limit=10"),
        ]);
        setStats(statsData);
        setFinancial(financialData);
        setRevenue(revenueData);
        setActivities(activitiesData);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(typeof error.detail === "string" ? error.detail : "Erro ao carregar dashboard");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  async function handleOpenDefaulters() {
    setDefaultersOpen(true);
    setDefaultersLoading(true);
    try {
      const data = await listDashboardDefaulters();
      setDefaulters(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar inadimplentes");
    } finally {
      setDefaultersLoading(false);
    }
  }

  function getDaysOverdueColor(days: number) {
    if (days >= 90) return "text-red-600 bg-red-50";
    if (days >= 60) return "text-orange-600 bg-orange-50";
    if (days >= 30) return "text-yellow-600 bg-yellow-50";
    return "text-muted-foreground";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Visão geral do sistema" />
        <StatsCardsSkeleton count={4} />
        <StatsCardsSkeleton count={4} />
      </div>
    );
  }

  const revenueChartData = revenue.map((r) => ({
    month: r.month,
    amount: parseFloat(r.amount),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral do sistema" />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/clients" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.active_clients ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.total_clients ?? 0} total
                {(stats?.defaulter_clients ?? 0) > 0 && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleOpenDefaulters(); }}
                    className="text-destructive ml-2 underline underline-offset-2 hover:text-destructive/80 transition-colors cursor-pointer"
                  >
                    {stats?.defaulter_clients} inadimplente{(stats?.defaulter_clients ?? 0) > 1 ? "s" : ""}
                  </button>
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/developments" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lotes</CardTitle>
              <LandPlot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_lots ?? 0}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                  {stats?.available_lots ?? 0} disponíveis
                </Badge>
                {(stats?.reserved_lots ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700 border-0">
                    {stats?.reserved_lots} reservados
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {stats?.sold_lots ?? 0} vendidos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/financial" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {financial ? formatCurrency(financial.total_receivable) : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recebido: {financial ? formatCurrency(financial.total_received) : "—"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/services" className="transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ordens de Serviço</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.open_service_orders ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.completed_service_orders ?? 0} concluídas
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Client command row — controle de clientes */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={UserPlus}
          label="Novos no mês"
          value={stats?.new_clients_this_month ?? 0}
          hint="Clientes cadastrados"
          href="/admin/clients"
          accent="text-success"
        />
        <QuickStat
          icon={FileSignature}
          label="Contratos ativos"
          value={stats?.active_contracts ?? 0}
          hint="Lotes vinculados"
          href="/admin/financial"
        />
        <QuickStat
          icon={Handshake}
          label="Em negociação"
          value={stats?.in_negotiation_clients ?? 0}
          hint="Clientes renegociando"
          href="/admin/clients"
          accent={(stats?.in_negotiation_clients ?? 0) > 0 ? "text-yellow-600" : "text-foreground"}
        />
        <QuickStat
          icon={UserX}
          label="Inativos"
          value={stats?.inactive_clients ?? 0}
          hint="Sem contrato ativo"
          href="/admin/clients"
          accent="text-muted-foreground"
        />
      </div>

      {/* Upcoming collections — próximos vencimentos */}
      {financial && parseFloat(financial.due_soon_amount) > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Vencendo nos próximos 7 dias</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(financial.due_soon_amount)} em {financial.due_soon_count} fatura
                {financial.due_soon_count !== 1 ? "s" : ""} a receber
              </p>
            </div>
            <Link
              href="/admin/financial"
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80 whitespace-nowrap"
            >
              Ver faturas
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Financial Alert */}
      {financial && parseFloat(financial.total_overdue) > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">Atenção: Valores em Atraso</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(financial.total_overdue)} em {financial.overdue_count} fatura
                {financial.overdue_count > 1 ? "s" : ""} vencida{financial.overdue_count > 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECF0F1" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#7F8C8D" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#7F8C8D" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #DDE1E3",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#27AE60"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                Sem dados de receita
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo Financeiro</CardTitle>
            <CardDescription>Visão geral das finanças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Recebido</p>
                    <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-success">
                  {financial ? formatCurrency(financial.total_received) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/30">
                    <TrendingUp className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">A Receber</p>
                    <p className="text-xs text-muted-foreground">Faturas pendentes</p>
                  </div>
                </div>
                <span className="text-lg font-bold">
                  {financial ? formatCurrency(financial.total_receivable) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Em Atraso</p>
                    <p className="text-xs text-muted-foreground">
                      {financial?.overdue_count ?? 0} fatura{(financial?.overdue_count ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-destructive">
                  {financial ? formatCurrency(financial.total_overdue) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarClock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vencendo em 7 dias</p>
                    <p className="text-xs text-muted-foreground">
                      {financial?.due_soon_count ?? 0} fatura{(financial?.due_soon_count ?? 0) !== 1 ? "s" : ""} a receber
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">
                  {financial ? formatCurrency(financial.due_soon_amount) : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities — trilha real de auditoria */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas ações registradas no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity) => {
                const Icon = activityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <Badge variant="outline" className="mt-1 text-[11px] font-normal">
                        {activity.type}
                      </Badge>
                    </div>
                    <span
                      className="text-xs text-muted-foreground whitespace-nowrap ml-2 mt-0.5"
                      title={formatDate(activity.created_at)}
                    >
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente
            </p>
          )}
        </CardContent>
      </Card>
      {/* Defaulters Drill-Down Dialog */}
      <Dialog open={defaultersOpen} onOpenChange={setDefaultersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clientes Inadimplentes
            </DialogTitle>
            <DialogDescription>
              Detalhamento dos clientes com boletos vencidos
            </DialogDescription>
          </DialogHeader>
          {defaultersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : defaulters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhum cliente inadimplente encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Boletos Vencidos</TableHead>
                    <TableHead className="text-right">Valor em Atraso</TableHead>
                    <TableHead>Venc. Mais Antigo</TableHead>
                    <TableHead>Dias em Atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((d) => (
                    <TableRow key={d.client_id}>
                      <TableCell className="font-medium">{d.client_name}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCpfCnpj(d.cpf_cnpj)}</TableCell>
                      <TableCell className="text-sm">{formatPhone(d.phone)}</TableCell>
                      <TableCell className="text-right font-semibold">{d.overdue_invoices}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(d.overdue_amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.oldest_due_date ? formatDate(d.oldest_due_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getDaysOverdueColor(d.days_overdue)}`}>
                          {d.days_overdue} dias
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
