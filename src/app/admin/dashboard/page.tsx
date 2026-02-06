"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AdminStats, FinancialOverview, RevenueChart, RecentActivity } from "@/types";
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueChart[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.active_clients ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_clients ?? 0} total
              {(stats?.defaulter_clients ?? 0) > 0 && (
                <span className="text-destructive ml-2">
                  {stats?.defaulter_clients} inadimplente{(stats?.defaulter_clients ?? 0) > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lotes</CardTitle>
            <LandPlot className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_lots ?? 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                {stats?.available_lots ?? 0} disponíveis
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats?.sold_lots ?? 0} vendidos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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
      </div>

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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
