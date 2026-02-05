'use client';

import { useState } from 'react';
import { useReferrals, useCreateReferral } from '@/hooks/useReferrals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Users, Plus, Gift, Phone, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Referral } from '@/types/client';

const referralSchema = z.object({
  referred_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  referred_phone: z.string().min(10, 'Telefone inválido'),
  referred_email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type ReferralFormData = z.infer<typeof referralSchema>;

export default function ClientReferralsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading, error, refetch } = useReferrals();
  const createReferral = useCreateReferral();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
  });

  const onSubmit = async (formData: ReferralFormData) => {
    await createReferral.mutateAsync({
      referred_name: formData.referred_name,
      referred_phone: formData.referred_phone,
      referred_email: formData.referred_email || undefined,
    });
    setIsDialogOpen(false);
    reset();
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorMessage message="Erro ao carregar indicações" onRetry={refetch} />;
  }

  const referrals = data?.referrals || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Indicações</h1>
          <p className="text-muted-foreground">
            Indique amigos e ganhe benefícios
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Indicação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Indicar um Amigo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input {...register('referred_name')} placeholder="Nome do indicado" />
                {errors.referred_name && (
                  <p className="text-sm text-destructive">{errors.referred_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  {...register('referred_phone')}
                  placeholder="(11) 99999-9999"
                />
                {errors.referred_phone && (
                  <p className="text-sm text-destructive">{errors.referred_phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  {...register('referred_email')}
                  type="email"
                  placeholder="email@exemplo.com"
                />
                {errors.referred_email && (
                  <p className="text-sm text-destructive">{errors.referred_email.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createReferral.isPending}>
                  Enviar Indicação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Programa de Indicações</h3>
              <p className="text-muted-foreground">
                Indique amigos e familiares interessados em nossos lotes. Para cada indicação
                que se tornar cliente, você ganha benefícios exclusivos!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Minhas Indicações ({data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não fez nenhuma indicação
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Fazer Primeira Indicação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral: Referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold">{referral.referred_name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {referral.referred_phone}
                      </span>
                      {referral.referred_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {referral.referred_email}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Indicado em {formatDate(referral.created_at)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(referral.status)}>
                    {getStatusLabel(referral.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
