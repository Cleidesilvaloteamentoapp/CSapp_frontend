"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ServiceTypeResponse, ServiceOrderResponse } from "@/types";

const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  requested: { label: "Solicitado", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  in_progress: { label: "Em Andamento", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function PortalServicesPage() {
  const [types, setTypes] = useState<ServiceTypeResponse[]>([]);
  const [orders, setOrders] = useState<ServiceOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ServiceTypeResponse[]>("/client/services/types"),
      api.get<ServiceOrderResponse[]>("/client/services/orders"),
    ])
      .then(([t, o]) => { setTypes(t); setOrders(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRequest() {
    if (!selectedType) return;
    setSaving(true);
    try {
      const order = await api.post<ServiceOrderResponse>("/client/services/orders", {
        service_type_id: selectedType,
        notes: notes || undefined,
      });
      setOrders((prev) => [order, ...prev]);
      toast.success("Serviço solicitado com sucesso");
      setRequestOpen(false);
      setSelectedType("");
      setNotes("");
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao solicitar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Serviços" description="Solicite e acompanhe serviços" />
        <Button onClick={() => setRequestOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Solicitar
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wrench className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum serviço solicitado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = ORDER_STATUS[order.status] || ORDER_STATUS.requested;
            return (
              <Card key={order.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-sm">Solicitado em {formatDate(order.requested_date)}</p>
                    {order.notes && <p className="text-xs text-muted-foreground mt-0.5">{order.notes}</p>}
                  </div>
                  <div className="text-right">
                    {order.cost && <p className="font-semibold text-sm">{formatCurrency(order.cost)}</p>}
                    <Badge variant={st.variant} className="mt-1 text-xs">{st.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Serviço</DialogTitle>
            <DialogDescription>Escolha o tipo de serviço desejado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Serviço</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {types.filter((t) => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {formatCurrency(t.base_price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes adicionais..." className="mt-1" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancelar</Button>
              <Button onClick={handleRequest} disabled={saving || !selectedType}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Solicitar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
