'use client';

import Link from 'next/link';
import { useClientDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { MapPin, Receipt, AlertCircle, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default function ClientDashboardPage() {
  const { data: dashboard, isLoading, error, refetch } = useClientDashboard();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar dashboard" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao Portal</h1>
        <p className="text-muted-foreground">
          Acompanhe seus lotes, boletos e solicitações
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboard?.total_paid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(dashboard?.total_pending || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serviços Pendentes</p>
                <p className="text-2xl font-bold">{dashboard?.pending_services || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {dashboard?.next_invoice && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold">Próximo Vencimento</p>
                  <p className="text-sm text-muted-foreground">
                    Boleto vence em {formatDate(dashboard.next_invoice.due_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xl font-bold">
                  {formatCurrency(dashboard.next_invoice.amount)}
                </p>
                <Link href="/financial">
                  <Button>Ver Boleto</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Meus Lotes
            </CardTitle>
            <Link href="/lots">
              <Button variant="ghost" size="sm">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.lots?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum lote vinculado
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard?.lots?.map((lot) => (
                  <div
                    key={lot.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        Quadra {lot.block} - Lote {lot.lot_number}
                      </p>
                      <p className="text-sm text-muted-foreground">{lot.address}</p>
                    </div>
                    <Badge className={getStatusColor(lot.status)}>
                      {getStatusLabel(lot.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/financial" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                Ver Meus Boletos
              </Button>
            </Link>
            <Link href="/services/request" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Solicitar Serviço
              </Button>
            </Link>
            <Link href="/documents" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                Acessar Documentos
              </Button>
            </Link>
            <Link href="/referrals" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" />
                Indicar um Amigo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
