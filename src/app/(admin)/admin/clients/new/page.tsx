'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateClient } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.object({
    street: z.string().min(3, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Bairro é obrigatório'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres'),
    zip_code: z.string().min(8, 'CEP inválido'),
  }),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientFormData) => {
    await createClient.mutateAsync(data);
    router.push('/admin/clients');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome Completo</Label>
                <Input {...register('full_name')} placeholder="Nome do cliente" />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Senha Inicial</Label>
                <Input {...register('password')} type="password" placeholder="••••••••" />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input {...register('cpf_cnpj')} placeholder="000.000.000-00" />
                {errors.cpf_cnpj && (
                  <p className="text-sm text-destructive">{errors.cpf_cnpj.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register('phone')} placeholder="(11) 99999-9999" />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Endereço</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Rua</Label>
                  <Input {...register('address.street')} placeholder="Nome da rua" />
                  {errors.address?.street && (
                    <p className="text-sm text-destructive">{errors.address.street.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input {...register('address.number')} placeholder="123" />
                </div>

                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input {...register('address.complement')} placeholder="Apto, Bloco..." />
                </div>

                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input {...register('address.neighborhood')} placeholder="Bairro" />
                </div>

                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input {...register('address.zip_code')} placeholder="00000-000" />
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input {...register('address.city')} placeholder="Cidade" />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input {...register('address.state')} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/admin/clients">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
