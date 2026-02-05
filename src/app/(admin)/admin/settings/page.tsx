'use client';

import { useState } from 'react';
import { useServiceTypes, useCreateServiceType, useUpdateServiceType } from '@/hooks/useServiceOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { Settings, Plus, Edit, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServiceType } from '@/types/service';

const serviceTypeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  base_price: z.number().positive('Preço deve ser maior que zero'),
  is_active: z.boolean(),
});

type ServiceTypeFormData = z.infer<typeof serviceTypeSchema>;

export default function AdminSettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);

  const { data: serviceTypes, isLoading, error, refetch } = useServiceTypes();
  const createServiceType = useCreateServiceType();
  const updateServiceType = useUpdateServiceType();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceTypeFormData>({
    resolver: zodResolver(serviceTypeSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const onSubmit = async (data: ServiceTypeFormData) => {
    if (editingType) {
      await updateServiceType.mutateAsync({ id: editingType.id, data });
    } else {
      await createServiceType.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingType(null);
    reset();
  };

  const handleEdit = (type: ServiceType) => {
    setEditingType(type);
    reset({
      name: type.name,
      description: type.description || '',
      base_price: type.base_price,
      is_active: type.is_active,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar configurações" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Tipos de Serviço</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tipos de Serviço
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingType(null);
                  reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingType ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input {...register('name')} placeholder="Ex: Limpeza de Terreno" />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        {...register('description')}
                        placeholder="Descrição do serviço..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preço Base (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register('base_price', { valueAsNumber: true })}
                      />
                      {errors.base_price && (
                        <p className="text-sm text-destructive">{errors.base_price.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        {...register('is_active')}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="is_active">Serviço Ativo</Label>
                    </div>

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
                        disabled={createServiceType.isPending || updateServiceType.isPending}
                      >
                        {editingType ? 'Salvar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {serviceTypes?.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum tipo de serviço cadastrado
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Tipo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceTypes?.map((type: ServiceType) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{type.name}</p>
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {type.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-primary">
                          {formatCurrency(type.base_price)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações gerais do sistema serão adicionadas em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
