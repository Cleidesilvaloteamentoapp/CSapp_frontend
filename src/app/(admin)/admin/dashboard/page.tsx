'use client';

import { useAdminDashboard } from '@/hooks/useDashboard';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, MapPin, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useAdminDashboard();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar dashboard" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão imobiliária
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Clientes"
          value={stats?.total_clients || 0}
          icon={Users}
        />
        <StatsCard
          title="Contratos Ativos"
          value={stats?.active_contracts || 0}
          icon={MapPin}
        />
        <StatsCard
          title="Boletos Pendentes"
          value={stats?.pending_invoices || 0}
          icon={Receipt}
        />
        <StatsCard
          title="Valor em Atraso"
          value={formatCurrency(stats?.overdue_amount || 0)}
          icon={AlertTriangle}
          className="border-red-200 dark:border-red-800"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthly_revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) =>
                      `R$ ${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                    labelStyle={{ color: 'var(--foreground)' }}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_payments?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pagamento recente
                </p>
              ) : (
                stats?.recent_payments?.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{payment.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.paid_at)}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
