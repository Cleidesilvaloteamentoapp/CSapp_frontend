'use client';

import Link from 'next/link';
import { useClientServiceOrders } from '@/hooks/useServiceOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Wrench, Plus } from 'lucide-react';

export default function ClientServicesPage() {
  const { data: orders, isLoading, error, refetch } = useClientServiceOrders();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar solicitações" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Acompanhe suas solicitações de serviço
          </p>
        </div>
        <Link href="/services/request">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Minhas Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders?.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não fez nenhuma solicitação
              </p>
              <Link href="/services/request">
                <Button>Solicitar Serviço</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders?.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">#{order.order_number}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        {order.priority && (
                        <Badge variant="outline">
                          {getStatusLabel(order.priority)}
                        </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {order.service_type?.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Criado em: {formatDate(order.created_at)}</p>
                      {order.scheduled_date && (
                        <p>Agendado: {formatDate(order.scheduled_date)}</p>
                      )}
                    </div>
                  </div>
                  {order.admin_notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Observação da equipe:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
