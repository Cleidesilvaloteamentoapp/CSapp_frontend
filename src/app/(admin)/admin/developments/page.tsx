'use client';

import { useState } from 'react';
import { useAdminDevelopments, useCreateDevelopment, useUpdateDevelopment } from '@/hooks/useLots';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatDate } from '@/lib/utils';
import { Building, Plus, Edit, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Development, CreateDevelopmentData } from '@/types/lot';

const developmentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  location: z.string().min(3, 'Localização é obrigatória'),
});

type DevelopmentFormData = z.infer<typeof developmentSchema>;

export default function AdminDevelopmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Development | null>(null);

  const { data: developments, isLoading, error, refetch } = useAdminDevelopments();
  const createDevelopment = useCreateDevelopment();
  const updateDevelopment = useUpdateDevelopment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DevelopmentFormData>({
    resolver: zodResolver(developmentSchema),
  });

  const onSubmit = async (data: DevelopmentFormData) => {
    if (editingDev) {
      await updateDevelopment.mutateAsync({ id: editingDev.id, data });
    } else {
      await createDevelopment.mutateAsync(data as CreateDevelopmentData);
    }
    setIsDialogOpen(false);
    setEditingDev(null);
    reset();
  };

  const handleEdit = (dev: Development) => {
    setEditingDev(dev);
    reset({
      name: dev.name,
      description: dev.description || '',
      location: dev.location,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar empreendimentos" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empreendimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os empreendimentos imobiliários
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingDev(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Empreendimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDev ? 'Editar Empreendimento' : 'Novo Empreendimento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input {...register('name')} placeholder="Residencial Jardim das Flores" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Localização</Label>
                <Input {...register('location')} placeholder="Rodovia BR-101, Km 45" />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Descrição do empreendimento..."
                  rows={3}
                />
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
                  disabled={createDevelopment.isPending || updateDevelopment.isPending}
                >
                  {editingDev ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {developments?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum empreendimento cadastrado
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Empreendimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          developments?.map((dev: Development) => (
            <Card key={dev.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dev.name}</CardTitle>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(dev)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{dev.location}</span>
                  </div>
                  {dev.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {dev.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Criado em {formatDate(dev.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
