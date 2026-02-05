'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientLots } from '@/hooks/useLots';
import { useServiceTypes, useCreateServiceOrder } from '@/hooks/useServiceOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageLoading } from '@/components/shared/Loading';
import { ErrorMessage } from '@/components/shared/ErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { Wrench, ArrowLeft, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { ClientLot } from '@/types/client';
import { ServiceType } from '@/types/service';

export default function RequestServicePage() {
  const router = useRouter();
  const { data: lots, isLoading: lotsLoading } = useClientLots();
  const { data: serviceTypes, isLoading: typesLoading } = useServiceTypes(true);
  const createOrder = useCreateServiceOrder();

  const [selectedLot, setSelectedLot] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [notes, setNotes] = useState('');

  const selectedServiceType = serviceTypes?.find((s: ServiceType) => s.id === selectedService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLot || !selectedService) return;

    await createOrder.mutateAsync({
      lot_id: selectedLot,
      service_type_id: selectedService,
      requested_date: new Date().toISOString().split('T')[0],
      notes: notes || undefined,
    });

    router.push('/services');
  };

  if (lotsLoading || typesLoading) {
    return <PageLoading />;
  }

  if (!lots || lots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/services">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Solicitar Serviço</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Você não possui lotes vinculados. <br />
              Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Solicitar Serviço</h1>
          <p className="text-muted-foreground">
            Preencha os dados para solicitar um serviço
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Nova Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Selecione o Lote</Label>
              <Select value={selectedLot} onValueChange={setSelectedLot}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um lote..." />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot: ClientLot) => (
                    <SelectItem key={lot.id} value={lot.lot_id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {lot.development_name} - Lote {lot.lot_number}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.map((type: ServiceType) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{type.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(type.base_price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedServiceType && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-medium">Valor Base:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(selectedServiceType.base_price)}
                  </span>
                </div>
                {selectedServiceType.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedServiceType.description}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva detalhes adicionais sobre o serviço..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/services">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!selectedLot || !selectedService || createOrder.isPending}
              >
                {createOrder.isPending ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
