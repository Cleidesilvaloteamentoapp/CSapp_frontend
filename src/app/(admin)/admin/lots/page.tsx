'use client';

import { useState } from 'react';
import { useAdminLots, useAdminDevelopments, useCreateLot, useUpdateLot } from '@/hooks/useLots';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';
import { MapPin, Plus, Search, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lot, LotStatus, CreateLotData } from '@/types/lot';

const lotSchema = z.object({
  development_id: z.string().min(1, 'Empreendimento é obrigatório'),
  lot_number: z.string().min(1, 'Número do lote é obrigatório'),
  block: z.string().optional(),
  area_m2: z.number().positive('Área deve ser maior que zero'),
  price: z.number().positive('Preço deve ser maior que zero'),
  status: z.enum(['available', 'reserved', 'sold']).optional(),
});

type LotFormData = z.infer<typeof lotSchema>;

export default function AdminLotsPage() {
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'all'>('all');
  const [developmentFilter, setDevelopmentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<string | null>(null);

  const { data: lots, isLoading, error, refetch } = useAdminLots({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    development_id: developmentFilter !== 'all' ? developmentFilter : undefined,
  });
  const { data: developments } = useAdminDevelopments();
  const createLot = useCreateLot();
  const updateLot = useUpdateLot();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      status: 'available',
    },
  });

  const onSubmit = async (data: LotFormData) => {
    if (editingLot) {
      await updateLot.mutateAsync({ id: editingLot, data });
    } else {
      await createLot.mutateAsync(data as CreateLotData);
    }
    setIsDialogOpen(false);
    setEditingLot(null);
    reset();
  };

  const handleEdit = (lot: Lot) => {
    setEditingLot(lot.id);
    setValue('development_id', lot.development_id);
    setValue('lot_number', lot.lot_number);
    setValue('block', lot.block || '');
    setValue('area_m2', lot.area_m2);
    setValue('price', lot.price);
    setValue('status', lot.status);
    setIsDialogOpen(true);
  };

  const filteredLots = lots?.filter((lot) =>
    lot.lot_number.toLowerCase().includes(search.toLowerCase()) ||
    lot.block?.toLowerCase().includes(search.toLowerCase()) ||
    lot.development_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar lotes" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lotes</h1>
          <p className="text-muted-foreground">
            Gerencie os lotes dos empreendimentos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingLot(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLot ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select
                  value={watch('development_id')}
                  onValueChange={(value) => setValue('development_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {developments?.map((dev: { id: string; name: string }) => (
                      <SelectItem key={dev.id} value={dev.id}>
                        {dev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.development_id && (
                  <p className="text-sm text-destructive">{errors.development_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quadra</Label>
                  <Input {...register('block')} placeholder="A" />
                </div>
                <div className="space-y-2">
                  <Label>Número do Lote</Label>
                  <Input {...register('lot_number')} placeholder="01" />
                  {errors.lot_number && (
                    <p className="text-sm text-destructive">{errors.lot_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área (m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('area_m2', { valueAsNumber: true })}
                  />
                  {errors.area_m2 && (
                    <p className="text-sm text-destructive">{errors.area_m2.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {editingLot && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as LotStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="reserved">Reservado</SelectItem>
                      <SelectItem value="sold">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createLot.isPending || updateLot.isPending}
                >
                  {editingLot ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lotes..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={developmentFilter} onValueChange={setDevelopmentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Empreendimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {developments?.map((dev: { id: string; name: string }) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LotStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservado</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lote encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLots?.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {lot.block ? `Qd. ${lot.block} - ` : ''}Lt. {lot.lot_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{lot.development_name}</TableCell>
                    <TableCell>{lot.area_m2} m²</TableCell>
                    <TableCell>{formatCurrency(lot.price)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lot.status)}>
                        {getStatusLabel(lot.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(lot)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
