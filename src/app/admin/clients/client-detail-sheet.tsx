"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, FileText, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { formatPhone, formatCpfCnpj, formatDate, formatCurrency } from "@/lib/format";
import type { ClientResponse, ClientLotResponse, InvoiceResponse } from "@/types";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
  defaulter: { label: "Inadimplente", variant: "destructive" },
};

const INVOICE_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Vencida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

interface ClientDetailSheetProps {
  client: ClientResponse | null;
  onClose: () => void;
  onEdit: (client: ClientResponse) => void;
}

export function ClientDetailSheet({ client, onClose, onEdit }: ClientDetailSheetProps) {
  const [lots, setLots] = useState<ClientLotResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    Promise.all([
      api.get<ClientLotResponse[]>(`/admin/clients/${client.id}/lots`).catch(() => []),
      api.get<InvoiceResponse[]>(`/admin/clients/${client.id}/invoices`).catch(() => []),
    ])
      .then(([lotsData, invoicesData]) => {
        setLots(lotsData);
        setInvoices(invoicesData);
      })
      .finally(() => setLoading(false));
  }, [client]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!client || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      await api.upload(`/admin/clients/${client.id}/documents`, e.target.files[0]);
      toast.success("Documento enviado com sucesso");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao enviar documento");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const status = client ? STATUS_MAP[client.status] || STATUS_MAP.active : STATUS_MAP.active;
  const addr = (client?.address as Record<string, string>) || {};

  return (
    <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {client && (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl">{client.full_name}</SheetTitle>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </SheetHeader>

            <Tabs defaultValue="info" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">Dados</TabsTrigger>
                <TabsTrigger value="lots" className="flex-1">Lotes</TabsTrigger>
                <TabsTrigger value="invoices" className="flex-1">Faturas</TabsTrigger>
                <TabsTrigger value="docs" className="flex-1">Docs</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  <InfoRow label="E-mail" value={client.email} />
                  <InfoRow label="Telefone" value={formatPhone(client.phone)} />
                  <InfoRow label="CPF/CNPJ" value={formatCpfCnpj(client.cpf_cnpj)} />
                  {addr.street && (
                    <InfoRow
                      label="Endereço"
                      value={`${addr.street}, ${addr.number || "S/N"} — ${addr.city || ""}/${addr.state || ""} ${addr.zip || ""}`}
                    />
                  )}
                  <InfoRow label="Cadastrado em" value={formatDate(client.created_at)} />
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => { onClose(); onEdit(client); }}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar cliente
                </Button>
              </TabsContent>

              <TabsContent value="lots" className="mt-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
                ) : lots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum lote associado</p>
                ) : (
                  <div className="space-y-3">
                    {lots.map((lot) => (
                      <div key={lot.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">Lote {lot.lot_id.slice(0, 8)}...</p>
                          <Badge variant="secondary">{lot.status}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <p>Valor: {formatCurrency(lot.total_value)}</p>
                          <p>Compra: {formatDate(lot.purchase_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma fatura</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((inv) => {
                      const invStatus = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;
                      return (
                        <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">Parcela {inv.installment_number}</p>
                            <p className="text-xs text-muted-foreground">Venc: {formatDate(inv.due_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(inv.amount)}</p>
                            <Badge variant={invStatus.variant} className="mt-1 text-xs">{invStatus.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="docs" className="mt-4">
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Clique para enviar documento</>
                    )}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {client.documents && client.documents.length > 0 ? (
                    <div className="space-y-2">
                      {client.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate">{doc.path || doc.url || `Documento ${i + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">Nenhum documento</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
