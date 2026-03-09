"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, FileText, Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { formatPhone, formatCpfCnpj, formatDate, formatCurrency } from "@/lib/format";
import { useClientBoletos } from "@/hooks/use-client-boletos";
import { downloadBoletoPdf, triggerPdfDownload } from "@/services/sicredi";
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

const BOLETO_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NORMAL: { label: "Em Aberto", variant: "outline" },
  EM_ABERTO: { label: "Em Aberto", variant: "outline" },
  LIQUIDADO: { label: "Pago", variant: "default" },
  VENCIDO: { label: "Vencido", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
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
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  
  const { boletos, loading: boletosLoading, error: boletosError } = useClientBoletos(client?.id || null);

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

  async function handleDownloadBoletoPdf(linhaDigitavel: string, nossoNumero: string) {
    setDownloadingPdf(nossoNumero);
    try {
      const blob = await downloadBoletoPdf(linhaDigitavel);
      triggerPdfDownload(blob, `boleto_${nossoNumero}.pdf`);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error("Erro ao baixar PDF do boleto");
    } finally {
      setDownloadingPdf(null);
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">Dados</TabsTrigger>
                <TabsTrigger value="lots">Lotes</TabsTrigger>
                <TabsTrigger value="invoices">Faturas</TabsTrigger>
                <TabsTrigger value="boletos">Boletos</TabsTrigger>
                <TabsTrigger value="docs">Docs</TabsTrigger>
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

              <TabsContent value="boletos" className="mt-4">
                {boletosLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carregando boletos...</p>
                ) : boletosError ? (
                  <p className="text-sm text-destructive text-center py-8">{boletosError}</p>
                ) : boletos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum boleto encontrado</p>
                ) : (
                  <div className="space-y-3">
                    {boletos.map((boleto) => {
                      const boletoStatus = BOLETO_STATUS[boleto.situacao] || BOLETO_STATUS.NORMAL;
                      return (
                        <div key={boleto.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium">Nosso Número: {boleto.nosso_numero}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Controle: {boleto.seu_numero}
                              </p>
                            </div>
                            <Badge variant={boletoStatus.variant}>{boletoStatus.label}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Valor</p>
                              <p className="font-semibold">{formatCurrency(boleto.valor)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimento</p>
                              <p className="font-medium">{formatDate(boleto.data_vencimento)}</p>
                            </div>
                          </div>

                          {boleto.tipo_cobranca === "HIBRIDO" && (
                            <Badge variant="secondary" className="text-xs">
                              Boleto Híbrido (Pix)
                            </Badge>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDownloadBoletoPdf(boleto.linha_digitavel, boleto.nosso_numero)}
                              disabled={downloadingPdf === boleto.nosso_numero}
                            >
                              {downloadingPdf === boleto.nosso_numero ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Baixando...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-3 w-3" />
                                  Baixar PDF
                                </>
                              )}
                            </Button>
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
