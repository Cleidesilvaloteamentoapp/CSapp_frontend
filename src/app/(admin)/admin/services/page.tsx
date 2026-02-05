'use client';

import { useState } from 'react';
import { useAdminServiceOrders, useUpdateServiceOrder, useServiceTypes } from '@/hooks/useServiceOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Wrench, Search, Eye } from 'lucide-react';
import { ServiceOrder, ServiceOrderStatus } from '@/types/service';

export default function AdminServicesPage() {
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ServiceOrderStatus>('requested');
  const [notes, setNotes] = useState('');

  const { data: orders, isLoading, error, refetch } = useAdminServiceOrders({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: serviceTypes } = useServiceTypes();
  const updateOrder = useUpdateServiceOrder();

  const handleViewOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNotes(order.notes || '');
    setIsDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    await updateOrder.mutateAsync({
      id: selectedOrder.id,
      data: {
        status: newStatus,
        notes,
      },
    });
    setIsDialogOpen(false);
  };

  const filteredOrders = orders?.filter((order) =>
    order.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    order.service_type_name?.toLowerCase().includes(search.toLowerCase())
  );

  const ordersByStatus = {
    requested: filteredOrders?.filter((o) => o.status === 'requested') || [],
    approved: filteredOrders?.filter((o) => o.status === 'approved') || [],
    in_progress: filteredOrders?.filter((o) => o.status === 'in_progress') || [],
    completed: filteredOrders?.filter((o) => o.status === 'completed') || [],
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar ordens de serviço" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
        <p className="text-muted-foreground">
          Gerencie as solicitações de serviço dos clientes
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou serviço..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ServiceOrderStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="requested">Solicitado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="requested" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requested">
            Solicitados ({ordersByStatus.requested.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovados ({ordersByStatus.approved.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({ordersByStatus.in_progress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({ordersByStatus.completed.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Data Solicitação</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma ordem de serviço
                        </TableCell>
                      </TableRow>
                    ) : (
                      statusOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.client_name}
                          </TableCell>
                          <TableCell>{order.service_type_name}</TableCell>
                          <TableCell>{order.lot_number || '-'}</TableCell>
                          <TableCell>{formatDate(order.requested_date)}</TableCell>
                          <TableCell>{formatCurrency(order.cost)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Serviço</p>
                  <p className="font-medium">{selectedOrder.service_type_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lote</p>
                  <p className="font-medium">{selectedOrder.lot_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Custo Base</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.cost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Solicitação</p>
                  <p className="font-medium">{formatDate(selectedOrder.requested_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Execução</p>
                  <p className="font-medium">
                    {selectedOrder.execution_date ? formatDate(selectedOrder.execution_date) : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ServiceOrderStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Solicitado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre o serviço..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateOrder} disabled={updateOrder.isPending}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
