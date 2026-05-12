"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Home, Link2, Plus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { lotCreateSchema, lotAssignSchema, type LotCreateFormData, type LotAssignFormData } from "@/lib/validators";
import { formatCurrency } from "@/lib/format";
import type { DevelopmentResponse, LotResponse, ClientResponse, ClientLotResponse, CompanyFinancialSettingsResponse } from "@/types";
import { getFinancialSettings } from "@/services/admin";
import { cn } from "@/lib/utils";
import { HelpHint } from "./help-hint";

interface StepImovelProps {
  client: ClientResponse;
  onComplete: (clientLot: ClientLotResponse, invoiceCount: number) => void;
  onBack: () => void;
}

const LOT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
};

export function StepImovel({ client, onComplete, onBack }: StepImovelProps) {
  const [mode, setMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [developments, setDevelopments] = useState<DevelopmentResponse[]>([]);
  const [selectedDev, setSelectedDev] = useState<string>("");
  const [lots, setLots] = useState<LotResponse[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LotResponse | null>(null);
  const [companyDefaults, setCompanyDefaults] = useState<CompanyFinancialSettingsResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newLotId, setNewLotId] = useState<string | null>(null);

  // Create lot form
  const createForm = useForm<LotCreateFormData>({
    resolver: zodResolver(lotCreateSchema) as never,
    defaultValues: { development_id: "", lot_number: "", block: "", area_m2: undefined as unknown as number, price: undefined as unknown as number },
  });

  // Assign form
  const assignForm = useForm<LotAssignFormData>({
    resolver: zodResolver(lotAssignSchema) as never,
    defaultValues: {
      client_id: client.id,
      lot_id: "",
      purchase_date: new Date().toISOString().split("T")[0],
      total_value: 0,
      payment_plan: { installments: 12, first_due: "" },
    },
  });

  const watchedLotId = assignForm.watch("lot_id");

  useEffect(() => {
    api.get<DevelopmentResponse[]>("/admin/developments/").catch(() => []).then((devs) => {
      setDevelopments(devs);
    });
    getFinancialSettings().catch(() => null).then((d) => setCompanyDefaults(d));
  }, []);

  useEffect(() => {
    if (!selectedDev) {
      setLots([]);
      return;
    }
    setLoadingLots(true);
    api.get<LotResponse[]>(`/admin/developments/${selectedDev}/lots?status=AVAILABLE`).catch(() => []).then((data) => {
      setLots(Array.isArray(data) ? data : []);
    }).finally(() => setLoadingLots(false));
  }, [selectedDev]);

  useEffect(() => {
    const lot = lots.find((l) => l.id === watchedLotId) || null;
    setSelectedLot(lot);
    if (lot) {
      assignForm.setValue("total_value", parseFloat(lot.price));
    }
  }, [watchedLotId, lots, assignForm]);

  useEffect(() => {
    if (selectedLot) {
      assignForm.setValue("lot_id", selectedLot.id);
    }
    assignForm.setValue("client_id", client.id);
  }, [selectedLot, client.id, assignForm]);

  useEffect(() => {
    if (newLotId) {
      assignForm.setValue("lot_id", newLotId);
    }
    assignForm.setValue("client_id", client.id);
  }, [newLotId, client.id, assignForm]);

  async function handleCreateLot(data: LotCreateFormData) {
    try {
      const res = await api.post<LotResponse>("/admin/lots", data);
      toast.success("Lote criado com sucesso");
      setNewLotId(res.id);
      setSelectedLot(res);
      setMode("EXISTING");
      setSelectedDev(data.development_id);
      // Force assign form to use the new lot
      assignForm.setValue("lot_id", res.id);
      assignForm.setValue("total_value", res.price ? parseFloat(String(res.price)) : 0);
      // Refresh lots list
      setLots((prev) => [res, ...prev]);
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao criar lote");
      else toast.error("Erro ao criar lote");
    }
  }

  async function handleAssign(data: LotAssignFormData) {
    setSubmitting(true);
    try {
      const res = await api.post<ClientLotResponse>("/admin/lots/assign", data);
      toast.success("Lote atrelado com sucesso! Parcelas geradas automaticamente.");
      // Try to count invoices created
      let invoiceCount = 0;
      try {
        const plan = res.payment_plan as { installments?: number } | null;
        invoiceCount = plan?.installments ?? 0;
      } catch {
        // ignore
      }
      onComplete(res, invoiceCount);
    } catch (error) {
      if (error instanceof ApiError) toast.error(typeof error.detail === "string" ? error.detail : "Erro ao atrelar lote");
      else toast.error("Erro ao atrelar lote");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "EXISTING" | "NEW")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="EXISTING">
            <Link2 className="mr-2 h-4 w-4" />
            Atrelar Existente
          </TabsTrigger>
          <TabsTrigger value="NEW">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Novo Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="EXISTING" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selecionar Lote</CardTitle>
              <CardDescription>
                Escolha um empreendimento e depois o lote disponível.
                <HelpHint text="Só serão listados lotes com status 'Disponível'. Lotes vendidos não aparecem." />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select value={selectedDev} onValueChange={setSelectedDev}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empreendimento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {developments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDev && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Lote
                    <HelpHint text="Selecione o lote que será vinculado ao cliente. O valor será preenchido automaticamente." />
                  </Label>
                  {loadingLots ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando lotes...
                    </div>
                  ) : lots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhum lote disponível neste empreendimento. Cadastre um novo lote na aba ao lado.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lots.map((lot) => {
                        const isSelected = selectedLot?.id === lot.id;
                        return (
                          <button
                            key={lot.id}
                            type="button"
                            onClick={() => {
                              setSelectedLot(lot);
                              assignForm.setValue("lot_id", lot.id);
                              assignForm.setValue("total_value", parseFloat(lot.price));
                            }}
                            className={cn(
                              "rounded-lg border p-3 text-left transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">
                                Lote {lot.lot_number}{lot.block ? ` - Quadra ${lot.block}` : ""}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {LOT_STATUS_LABELS[lot.status] ?? lot.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(lot.price)} &bull; {lot.area_m2}m²
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="NEW" className="space-y-4">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateLot)} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cadastrar Novo Lote</CardTitle>
                  <CardDescription>
                    Preencha os dados do lote no empreendimento escolhido.
                    <HelpHint text="Após criar o lote, ele será automaticamente selecionado para a vinculação ao cliente." />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="development_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empreendimento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {developments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="lot_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Lote</FormLabel>
                          <FormControl><Input placeholder="01" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="block"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quadra (opcional)</FormLabel>
                          <FormControl><Input placeholder="A" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="area_m2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="360" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput value={field.value as number | undefined} onChange={(v) => field.onChange(v ?? 0)} placeholder="150.000,00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createForm.formState.isSubmitting}>
                      {createForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar Lote"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      {/* Assignment form - visible once a lot is selected */}
      {(selectedLot || newLotId) && (
        <Form {...assignForm}>
          <form onSubmit={assignForm.handleSubmit(handleAssign)} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vincular ao Cliente</CardTitle>
                <CardDescription>
                  Confirme os dados da venda. Isso gerará as parcelas automaticamente.
                  <HelpHint text="O plano de pagamento define as parcelas internas (faturas). Boletos Sicredi são criados na próxima etapa, se desejado." />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                  <p className="font-semibold">Cliente: {client.full_name}</p>
                  {selectedLot && (
                    <p className="text-muted-foreground">
                      Lote {selectedLot.lot_number}{selectedLot.block ? ` - Quadra ${selectedLot.block}` : ""} &bull; {formatCurrency(selectedLot.price)}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={assignForm.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Compra</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignForm.control}
                    name="total_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Valor Total (R$)
                          <HelpHint text="Pode ser diferente do preço do lote (ex: desconto a vista, acréscimo de obra etc)." />
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput value={field.value as number | undefined} onChange={(v) => field.onChange(v ?? 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Plano de Pagamento</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={assignForm.control}
                      name="payment_plan.down_payment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Entrada (R$)
                            <HelpHint text="Valor pago à vista. Será descontado do total na geração das parcelas." />
                          </FormLabel>
                          <FormControl>
                            <CurrencyInput placeholder="0,00" value={field.value as number | undefined} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignForm.control}
                      name="payment_plan.monthly_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Valor Mensal (R$)
                            <HelpHint text="Se preenchido, fixa o valor de cada parcela. Se deixar em branco, o sistema divide o restante pelo número de parcelas." />
                          </FormLabel>
                          <FormControl>
                            <CurrencyInput placeholder="Automático" value={field.value as number | undefined} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={assignForm.control}
                      name="payment_plan.installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Parcelas
                            <HelpHint text="Total de parcelas do contrato (pode ser > 12). Os boletos bancários são gerados de 12 em 12." />
                          </FormLabel>
                          <FormControl>
                            <Input type="text" inputMode="numeric" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignForm.control}
                      name="payment_plan.first_due"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Primeiro Vencimento
                            <HelpHint text="Data do primeiro vencimento. Parcelas seguintes serão mensais a partir dessa data." />
                          </FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Rules - Inline */}
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Regras Financeiras</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Opcional — deixe em branco para usar os padrões da empresa.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={assignForm.control}
                      name="penalty_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Multa (%)
                            <HelpHint text="Multa por atraso. Ex: 2 = 2%. Usa o padrão da empresa se vazio." />
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder={companyDefaults ? String(companyDefaults.penalty_rate) : "2"} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignForm.control}
                      name="daily_interest_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Juros/dia (%/dia)
                            <HelpHint text="Juros diário por atraso. Ex: 0.033 = 0.033%/dia. Usa o padrão da empresa se vazio." />
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" placeholder={companyDefaults ? String(companyDefaults.daily_interest_rate) : "0.033"} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={assignForm.control}
                      name="adjustment_index"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Índice de Reajuste
                            <HelpHint text="Índice econômico para reajuste anual das parcelas. IPCA é o mais comum." />
                          </FormLabel>
                          <Select onValueChange={(v) => field.onChange(v === "__default__" ? undefined : v)} value={field.value ?? "__default__"}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Padrão" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="__default__">Padrão ({companyDefaults?.adjustment_index ?? "IPCA"})</SelectItem>
                              <SelectItem value="IPCA">IPCA</SelectItem>
                              <SelectItem value="IGPM">IGP-M</SelectItem>
                              <SelectItem value="CUB">CUB</SelectItem>
                              <SelectItem value="INPC">INPC</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignForm.control}
                      name="adjustment_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Frequência de Reajuste
                            <HelpHint text="Com que frequência o reajuste é aplicado às parcelas." />
                          </FormLabel>
                          <Select onValueChange={(v) => field.onChange(v === "__default__" ? undefined : v)} value={field.value ?? "__default__"}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Padrão" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="__default__">Padrão ({companyDefaults?.adjustment_frequency ?? "ANNUAL"})</SelectItem>
                              <SelectItem value="MONTHLY">Mensal</SelectItem>
                              <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                              <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                              <SelectItem value="ANNUAL">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={assignForm.control}
                      name="adjustment_custom_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Taxa Fixa (%)
                            <HelpHint text="Percentual fixo de reajuste, independente do índice econômico." />
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder={companyDefaults ? String(companyDefaults.adjustment_custom_rate) : "5"} {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={assignForm.control}
                      name="annual_adjustment_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Reajuste Anual (%)
                            <HelpHint text="Percentual fixo de reajuste anual, independente do índice. Ex: 5 = 5%/ano." />
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="5" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                  <p className="text-xs text-yellow-800">
                    <strong>Atenção:</strong> Confirmar esta venda irá gerar automaticamente as parcelas (faturas) no sistema. Se quiser gerar boletos bancários também, você poderá fazer isso na próxima etapa.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={onBack}>
                    Voltar
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-success hover:bg-success/90">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : "Confirmar Venda"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
