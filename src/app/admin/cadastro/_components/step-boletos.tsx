"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";
import {
  ArrowLeft,
  SkipForward,
  FileText,
  CalendarRange,
  ListChecks,
  Loader2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { formatCurrency } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ClientResponse, ClientLotResponse } from "@/types";
import type {
  CreateBoletoRequest,
  BatchCreateRequest,
  TipoCobranca,
  EspecieDocumento,
  TipoDesconto,
  TipoJuros,
  TipoMulta,
  BatchFrequency,
  BoletoCreated,
} from "@/types/sicredi";
import { FREQ_MONTHS } from "@/types/sicredi";
import { BatchProgressDialog } from "@/components/sicredi/batch-progress-dialog";
import { HelpHint } from "./help-hint";

interface StepBoletosProps {
  client: ClientResponse;
  clientLot?: ClientLotResponse | null;
  invoiceCount: number;
  onSkip: () => void;
  onComplete: (result: BoletoCreated | { batch_id: string; total_items: number }) => void;
  onBack: () => void;
}

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const ESPECIE_OPTIONS: { value: EspecieDocumento; label: string }[] = [
  { value: "DUPLICATA_MERCANTIL_INDICACAO", label: "Duplicata Mercantil por Indicação" },
  { value: "DUPLICATA_RURAL", label: "Duplicata Rural" },
  { value: "NOTA_PROMISSORIA", label: "Nota Promissória" },
  { value: "NOTA_PROMISSORIA_RURAL", label: "Nota Promissória Rural" },
  { value: "NOTA_SEGUROS", label: "Nota de Seguros" },
  { value: "RECIBO", label: "Recibo" },
  { value: "LETRA_CAMBIO", label: "Letra de Câmbio" },
  { value: "NOTA_DEBITO", label: "Nota de Débito" },
  { value: "DUPLICATA_SERVICO_INDICACAO", label: "Duplicata de Serviço por Indicação" },
  { value: "OUTROS", label: "Outros" },
];

const FREQ_OPTIONS: { value: BatchFrequency; label: string }[] = [
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral (3 meses)" },
  { value: "SEMESTRAL", label: "Semestral (6 meses)" },
  { value: "ANUAL", label: "Anual (12 meses)" },
];

const boletoSchema = z.object({
  tipo_cobranca: z.enum(["NORMAL", "HIBRIDO"]),
  documento: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CNPJ deve ter 14 dígitos").regex(/^\d+$/, "Apenas números"),
  nome: z.string().min(2, "Nome é obrigatório").max(100),
  endereco: z.string().min(2, "Endereço é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone inválido").optional().or(z.literal("")),
  especie_documento: z.string().min(1, "Espécie é obrigatória"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  seu_numero: z.string().min(1, "Seu número é obrigatório"),
  tipo_desconto: z.string().optional(),
  valor_desconto_1: z.coerce.number().min(0).optional(),
  data_desconto_1: z.string().optional(),
  tipo_juros: z.string().optional(),
  juros: z.coerce.number().min(0).optional(),
  tipo_multa: z.string().optional(),
  multa: z.coerce.number().min(0).optional(),
  informativos: z.string().optional(),
  mensagens: z.string().optional(),
});

type BoletoFormValues = z.infer<typeof boletoSchema>;

export function StepBoletos({ client, clientLot, invoiceCount, onSkip, onComplete, onBack }: StepBoletosProps) {
  const { create, createBatch, loading } = useSicrediBoletos();
  const [mode, setMode] = useState<"SKIP" | "INDIVIDUAL" | "BATCH">(clientLot ? "BATCH" : "SKIP");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"INDIVIDUAL" | "BATCH">("BATCH");

  // Pre-compute batch defaults from clientLot
  const computedParcelaValue = clientLot
    ? (clientLot.total_value - (clientLot.down_payment ?? 0)) / (clientLot.total_installments || 12)
    : 0;
  const computedFirstDue = (clientLot?.payment_plan as Record<string, unknown>)?.first_due as string | undefined;

  // Individual boleto form
  const form = useForm<BoletoFormValues>({
    resolver: zodResolver(boletoSchema) as any,
    mode: "onChange",
    defaultValues: {
      tipo_cobranca: "NORMAL",
      documento: client.cpf_cnpj.replace(/\D/g, ""),
      nome: client.full_name,
      endereco: "",
      cidade: "",
      uf: "",
      cep: "",
      email: client.email || "",
      telefone: client.phone?.replace(/\D/g, "") || "",
      especie_documento: "DUPLICATA_MERCANTIL_INDICACAO",
      data_vencimento: computedFirstDue || "",
      valor: computedParcelaValue > 0 ? Math.round(computedParcelaValue * 100) / 100 : 0,
      seu_numero: "",
      tipo_desconto: "ISENTO",
      valor_desconto_1: 0,
      data_desconto_1: "",
      tipo_juros: "ISENTO",
      juros: 0,
      tipo_multa: "ISENTO",
      multa: 0,
      informativos: "",
      mensagens: "",
    },
  });

  // Batch state — pre-populated from clientLot
  const [batchValor, setBatchValor] = useState(computedParcelaValue > 0 ? String(Math.round(computedParcelaValue * 100) / 100) : "");
  const [frequency, setFrequency] = useState<BatchFrequency>("MENSAL");
  const [durationMonths, setDurationMonths] = useState("12");
  const [dataInicio, setDataInicio] = useState(computedFirstDue || "");
  const [tipoJuros, setTipoJuros] = useState<TipoJuros>("ISENTO");
  const [juros, setJuros] = useState("");
  const [tipoMulta, setTipoMulta] = useState<TipoMulta>("ISENTO");
  const [multa, setMulta] = useState("");
  const [diasNegativacao, setDiasNegativacao] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);

  const addr = (client.address as Record<string, string>) || {};
  useState(() => {
    if (addr.street) {
      form.setValue("endereco", `${addr.street}, ${addr.number || "S/N"}`);
    }
    if (addr.city) form.setValue("cidade", addr.city);
    if (addr.state) form.setValue("uf", addr.state);
    if (addr.zip) form.setValue("cep", addr.zip.replace(/\D/g, ""));
  });

  const installments = useMemo(() => {
    if (!dataInicio || !batchValor || !durationMonths) return [];
    const val = parseFloat(batchValor);
    const dur = parseInt(durationMonths, 10);
    if (isNaN(val) || val <= 0 || isNaN(dur) || dur <= 0) return [];

    const freqMonths = FREQ_MONTHS[frequency];
    const count = Math.ceil(dur / freqMonths);
    const start = new Date(dataInicio + "T12:00:00");

    return Array.from({ length: count }, (_, i) => ({
      index: i + 1,
      dueDate: format(addMonths(start, i * freqMonths), "yyyy-MM-dd"),
      value: val,
    }));
  }, [dataInicio, batchValor, durationMonths, frequency]);

  const totalValue = installments.reduce((sum, i) => sum + i.value, 0);

  async function handleIndividualSubmit(data: BoletoFormValues) {
    const isPF = data.documento.length <= 11;
    const payload: CreateBoletoRequest = {
      client_id: client.id,
      tipo_cobranca: data.tipo_cobranca as TipoCobranca,
      pagador: {
        tipo_pessoa: isPF ? "PESSOA_FISICA" : "PESSOA_JURIDICA",
        documento: data.documento,
        nome: data.nome,
        endereco: data.endereco,
        cidade: data.cidade,
        uf: data.uf,
        cep: data.cep,
        email: data.email || undefined,
        telefone: data.telefone || undefined,
      },
      especie_documento: data.especie_documento as EspecieDocumento,
      data_vencimento: data.data_vencimento,
      valor: data.valor,
      seu_numero: data.seu_numero,
    };

    if (data.tipo_desconto && data.tipo_desconto !== "ISENTO") {
      payload.tipo_desconto = data.tipo_desconto as TipoDesconto;
      if (data.valor_desconto_1) payload.valor_desconto_1 = data.valor_desconto_1;
      if (data.data_desconto_1) payload.data_desconto_1 = data.data_desconto_1;
    }
    if (data.tipo_juros && data.tipo_juros !== "ISENTO") {
      payload.tipo_juros = data.tipo_juros as TipoJuros;
      if (data.juros) payload.juros = data.juros;
    }
    if (data.tipo_multa && data.tipo_multa !== "ISENTO") {
      payload.tipo_multa = data.tipo_multa as TipoMulta;
      if (data.multa) payload.multa = data.multa;
    }
    if (data.informativos?.trim()) {
      payload.informativos = data.informativos.split("\n").filter((l) => l.trim());
    }
    if (data.mensagens?.trim()) {
      payload.mensagens = data.mensagens.split("\n").filter((l) => l.trim());
    }

    const result = await create(payload);
    if (result) {
      toast.success("Boleto criado com sucesso!");
      onComplete(result);
    } else {
      toast.error("Erro ao criar boleto");
    }
  }

  const canSubmitBatch =
    parseFloat(batchValor) > 0 &&
    parseInt(durationMonths) > 0 &&
    dataInicio &&
    form.getValues("nome") &&
    form.getValues("documento") &&
    form.getValues("endereco") &&
    form.getValues("cidade") &&
    form.getValues("uf") &&
    form.getValues("cep");

  async function handleBatchSubmit() {
    if (!canSubmitBatch) return;
    const isPF = form.getValues("documento").length <= 11;
    const payload: BatchCreateRequest = {
      client_id: client.id,
      pagador: {
        tipo_pessoa: isPF ? "PESSOA_FISICA" : "PESSOA_JURIDICA",
        documento: form.getValues("documento"),
        nome: form.getValues("nome"),
        endereco: form.getValues("endereco"),
        cidade: form.getValues("cidade"),
        uf: form.getValues("uf"),
        cep: form.getValues("cep"),
      },
      valor: parseFloat(batchValor),
      frequency,
      duration_months: parseInt(durationMonths, 10),
      data_primeiro_vencimento: dataInicio,
    };

    if (tipoJuros !== "ISENTO" && juros) {
      payload.tipo_juros = tipoJuros;
      payload.juros = parseFloat(juros);
    }
    if (tipoMulta !== "ISENTO" && multa) {
      payload.tipo_multa = tipoMulta;
      payload.multa = parseFloat(multa);
    }
    if (diasNegativacao) {
      payload.dias_negativacao_auto = parseInt(diasNegativacao, 10);
    }

    const result = await createBatch(payload);
    if (result) {
      toast.success(`Lote iniciado: ${result.total_items} boletos`);
      setBatchId(result.batch_id);
      setProgressOpen(true);
      onComplete({ batch_id: result.batch_id, total_items: result.total_items });
    } else {
      toast.error("Erro ao criar lote de boletos");
    }
  }

  return (
    <div className="space-y-4">
      {invoiceCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p className="text-xs text-yellow-800">
            A etapa anterior gerou {invoiceCount} fatura(s) interna(s). Os boletos Sicredi abaixo são complementares ao banco e não se vinculam automaticamente às faturas existentes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setMode("SKIP")}
          className={cn(
            "rounded-lg border-2 p-4 text-left transition-colors",
            mode === "SKIP"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <SkipForward className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="font-semibold text-sm">Pular</p>
          <p className="text-xs text-muted-foreground mt-1">
            Não gerar boletos agora
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("INDIVIDUAL")}
          className={cn(
            "rounded-lg border-2 p-4 text-left transition-colors",
            mode === "INDIVIDUAL"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="font-semibold text-sm">Boleto Individual</p>
          <p className="text-xs text-muted-foreground mt-1">
            Um único boleto Sicredi
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("BATCH")}
          className={cn(
            "rounded-lg border-2 p-4 text-left transition-colors",
            mode === "BATCH"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <ListChecks className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="font-semibold text-sm">Gerar 12 Boletos</p>
          <p className="text-xs text-muted-foreground mt-1">
            Gera automaticamente 12 boletos no banco
          </p>
        </button>
      </div>

      {mode === "SKIP" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Você pode criar boletos Sicredi depois pela tela de Boletos.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
              <Button onClick={onSkip}>Continuar para Documentos</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(mode === "INDIVIDUAL" || mode === "BATCH") && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleIndividualSubmit)} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados do Pagador</CardTitle>
                <CardDescription>
                  Preenchidos automaticamente do cliente. Edite se necessário.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Nome
                          <HelpHint text="Nome completo conforme documento. Será impresso no boleto bancário." />
                        </FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          CPF/CNPJ
                          <HelpHint text="Apenas números, sem pontos ou traços. CPF: 11 dígitos. CNPJ: 14 dígitos." />
                        </FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          CEP
                          <HelpHint text="Apenas números, sem traço. 8 dígitos." />
                        </FormLabel>
                        <FormControl><Input {...field} maxLength={8} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Endereço
                          <HelpHint text="Endereço completo com número. Será enviado ao banco para registro do boleto." />
                        </FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UF_OPTIONS.map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {mode === "INDIVIDUAL" && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dados do Boleto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tipo_cobranca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tipo de Cobrança
                              <HelpHint text="NORMAL = boleto bancário padrão. HIBRIDO = inclui QR Code Pix para pagamento instantâneo." />
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="NORMAL">Boleto Tradicional</SelectItem>
                                <SelectItem value="HIBRIDO">Boleto Híbrido (Pix)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="especie_documento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Espécie Documento
                              <HelpHint text="Tipo de documento que fundamenta a cobrança. 'Duplicata Mercantil por Indicação' é o mais comum para loteamentos." />
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {ESPECIE_OPTIONS.map((e) => (
                                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="data_vencimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Data de Vencimento
                              <HelpHint text="Data futura no formato AAAA-MM-DD. Após esta data, juros e multa podem incidir." />
                            </FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="valor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Valor (R$)
                              <HelpHint text="Valor nominal do boleto. Será registrado no Sicredi. Mínimo R$ 2,50." />
                            </FormLabel>
                            <FormControl><CurrencyInput value={field.value as number | undefined} onChange={(v) => field.onChange(v ?? 0)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="seu_numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Seu Número
                            <HelpHint text="Identificador interno da cobrança. Pode ser o número da parcela ou contrato." />
                          </FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Descontos, Juros e Multa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tipo_desconto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tipo de Desconto
                              <HelpHint text="Desconto concedido se o pagador quitar antes da data limite. ISENTO = sem desconto." />
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ISENTO">Isento</SelectItem>
                                <SelectItem value="VALOR">Valor Fixo</SelectItem>
                                <SelectItem value="PERCENTUAL">Percentual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("tipo_desconto") !== "ISENTO" && (
                        <>
                          <FormField
                            control={form.control}
                            name="valor_desconto_1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor Desconto (R$ ou %)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="data_desconto_1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data Limite Desconto</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tipo_juros"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tipo de Juros
                              <HelpHint text="Juros cobrados após vencimento. VALOR_DIA = R$/dia. PERCENTUAL_MES = % ao mês." />
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ISENTO">Isento</SelectItem>
                                <SelectItem value="VALOR_DIA">Valor por Dia</SelectItem>
                                <SelectItem value="PERCENTUAL_MES">% ao Mês</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("tipo_juros") !== "ISENTO" && (
                        <FormField
                          control={form.control}
                          name="juros"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{form.watch("tipo_juros") === "VALOR_DIA" ? "Valor/Dia (R$)" : "% ao Mês"}</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tipo_multa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tipo de Multa
                              <HelpHint text="Multa cobrada após vencimento. VALOR = R$ fixo. PERCENTUAL = % sobre o valor do boleto." />
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ISENTO">Isento</SelectItem>
                                <SelectItem value="VALOR">Valor Fixo</SelectItem>
                                <SelectItem value="PERCENTUAL">Percentual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("tipo_multa") !== "ISENTO" && (
                        <FormField
                          control={form.control}
                          name="multa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{form.watch("tipo_multa") === "VALOR" ? "Valor (R$)" : "Percentual (%)"}</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Mensagens (opcional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="informativos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Informativos
                            <HelpHint text="Texto informativo impresso no corpo do boleto. Ex: 'Referente à parcela 1/12'." />
                          </FormLabel>
                          <FormControl><Input {...field} placeholder="Linha informativa no boleto" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mensagens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Mensagens
                            <HelpHint text="Instruções adicionais impressas no boleto. Ex: 'Após vencimento, cobrar multa de 2%'." />
                          </FormLabel>
                          <FormControl><Input {...field} placeholder="Instruções adicionais" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
                  <Button type="button" disabled={loading} onClick={async () => { const valid = await form.trigger(); if (valid) { setConfirmType("INDIVIDUAL"); setConfirmOpen(true); } }}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</> : "Gerar Boleto"}
                  </Button>
                </div>
              </>
            )}

            {mode === "BATCH" && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarRange className="h-4 w-4" />
                      Configuração das Parcelas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Valor por Parcela (R$)
                          <HelpHint text="Valor de cada boleto gerado. Calculado automaticamente a partir do plano de pagamento. Mínimo R$ 2,50." />
                        </Label>
                        <CurrencyInput value={batchValor ? parseFloat(batchValor) : undefined} onChange={(v) => setBatchValor(v != null ? String(v) : "")} placeholder="500,00" />
                        {batchValor && parseFloat(batchValor) <= 0 && (
                          <p className="text-xs text-destructive">Valor deve ser maior que zero</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Frequência
                          <HelpHint text="Intervalo entre os vencimentos dos boletos gerados." />
                        </Label>
                        <Select value={frequency} onValueChange={(v) => setFrequency(v as BatchFrequency)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FREQ_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Duração (meses)
                          <HelpHint text="Sempre 12 meses. O sistema gera boletos anualmente, de 12 em 12." />
                        </Label>
                        <Input type="number" min="1" max="12" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Máx 12 boletos por lote</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Primeiro Vencimento
                          <HelpHint text="Data de vencimento do primeiro boleto. Os demais serão calculados pela frequência escolhida." />
                        </Label>
                        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={cn(!dataInicio && "border-destructive")} />
                        {!dataInicio && (
                          <p className="text-xs text-destructive">Data de início é obrigatória</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Negativação Automática (dias, opcional)
                        <HelpHint text="Dias após vencimento para negativação no SPC/Serasa via Sicredi. Deixe vazio para não negativar." />
                      </Label>
                      <Input type="number" min="0" value={diasNegativacao} onChange={(e) => setDiasNegativacao(e.target.value)} placeholder="Ex: 30" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Juros e Multa (Opcional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Tipo de Juros
                          <HelpHint text="Juros cobrados após vencimento. VALOR_DIA = R$/dia. PERCENTUAL_MES = % ao mês." />
                        </Label>
                        <Select value={tipoJuros} onValueChange={(v) => setTipoJuros(v as TipoJuros)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ISENTO">Isento</SelectItem>
                            <SelectItem value="VALOR_DIA">Valor por Dia</SelectItem>
                            <SelectItem value="PERCENTUAL_MES">% ao Mês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {tipoJuros !== "ISENTO" && (
                        <div className="space-y-2">
                          <Label>{tipoJuros === "VALOR_DIA" ? "Valor/Dia (R$)" : "% ao Mês"}</Label>
                          <Input type="number" step="0.01" min="0" value={juros} onChange={(e) => setJuros(e.target.value)} placeholder="2.00" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          Tipo de Multa
                          <HelpHint text="Multa cobrada após vencimento. VALOR = R$ fixo. PERCENTUAL = % sobre o valor do boleto." />
                        </Label>
                        <Select value={tipoMulta} onValueChange={(v) => setTipoMulta(v as TipoMulta)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ISENTO">Isento</SelectItem>
                            <SelectItem value="VALOR">Valor Fixo</SelectItem>
                            <SelectItem value="PERCENTUAL">Percentual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {tipoMulta !== "ISENTO" && (
                        <div className="space-y-2">
                          <Label>{tipoMulta === "VALOR" ? "Valor (R$)" : "Percentual (%)"}</Label>
                          <Input type="number" step="0.01" min="0" value={multa} onChange={(e) => setMulta(e.target.value)} placeholder="2.00" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Prévia das Parcelas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {installments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Preencha valor, frequência, duração e data de início para visualizar.
                      </p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">#</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {installments.map((inst) => (
                              <TableRow key={inst.index}>
                                <TableCell className="font-medium">{inst.index}</TableCell>
                                <TableCell>{inst.dueDate}</TableCell>
                                <TableCell className="text-right">{formatCurrency(inst.value)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
                  <Button onClick={() => { setConfirmType("BATCH"); setConfirmOpen(true); }} disabled={!canSubmitBatch || loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando lote...</> : <>Criar {installments.length} Boletos</>}
                  </Button>
                </div>

                <BatchProgressDialog
                  open={progressOpen}
                  onOpenChange={setProgressOpen}
                  batchId={batchId}
                />
              </>
            )}
          </form>
        </Form>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
              {confirmType === "BATCH"
                ? `Confirmar geração de ${installments.length} boletos`
                : "Confirmar geração de boleto"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {confirmType === "BATCH" ? (
                  <>
                    <div className="rounded-md border p-3 text-sm space-y-1">
                      <p><strong>Quantidade:</strong> {installments.length} boletos</p>
                      <p><strong>Valor unitário:</strong> {formatCurrency(parseFloat(batchValor) || 0)}</p>
                      <p><strong>Total:</strong> {formatCurrency(totalValue)}</p>
                      <p><strong>Primeiro vencimento:</strong> {dataInicio || "—"}</p>
                      <p><strong>Frequência:</strong> {FREQ_OPTIONS.find(f => f.value === frequency)?.label}</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      <p className="text-xs text-yellow-800">
                        <strong>Atenção:</strong> Estes boletos serão registrados diretamente no banco Sicredi e não apenas na plataforma. A operação é irreversível.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-md border p-3 text-sm space-y-1">
                      <p><strong>Pagador:</strong> {form.getValues("nome")}</p>
                      <p><strong>Valor:</strong> {formatCurrency(form.getValues("valor") || 0)}</p>
                      <p><strong>Vencimento:</strong> {form.getValues("data_vencimento") || "—"}</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      <p className="text-xs text-yellow-800">
                        <strong>Atenção:</strong> Este boleto será registrado diretamente no banco Sicredi. A operação é irreversível.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmType === "BATCH") {
                  handleBatchSubmit();
                } else {
                  form.handleSubmit(handleIndividualSubmit)();
                }
              }}
              className="bg-primary"
            >
              Confirmar e Gerar no Banco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
