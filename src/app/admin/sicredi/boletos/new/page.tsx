"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Loader2,
  Copy,
  Check,
  Download,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ClientSelector } from "@/components/sicredi/client-selector";
import { ClientFormDialog } from "@/app/admin/clients/client-form-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { formatCurrency } from "@/lib/format";
import type {
  CreateBoletoRequest,
  BoletoCreated,
  TipoCobranca,
  EspecieDocumento,
  TipoDesconto,
  TipoJuros,
  TipoMulta,
} from "@/types/sicredi";
import type { ClientResponse } from "@/types";

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

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const boletoSchema = z.object({
  tipo_cobranca: z.enum(["NORMAL", "HIBRIDO"]),
  // Pagador
  tipo_pessoa: z.enum(["PESSOA_FISICA", "PESSOA_JURIDICA"]),
  documento: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CNPJ deve ter 14 dígitos")
    .regex(/^\d+$/, "Apenas números"),
  nome: z.string().min(2, "Nome é obrigatório").max(100),
  endereco: z.string().min(2, "Endereço é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  // Boleto
  especie_documento: z.string().min(1, "Espécie é obrigatória"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  seu_numero: z.string().min(1, "Seu número é obrigatório"),
  // Descontos/Juros/Multa (opcionais)
  tipo_desconto: z.string().optional(),
  valor_desconto_1: z.coerce.number().min(0).optional(),
  data_desconto_1: z.string().optional(),
  tipo_juros: z.string().optional(),
  juros: z.coerce.number().min(0).optional(),
  tipo_multa: z.string().optional(),
  multa: z.coerce.number().min(0).optional(),
  // Mensagens
  informativos: z.string().optional(),
  mensagens: z.string().optional(),
});

type BoletoFormValues = z.infer<typeof boletoSchema>;

const STEPS = [
  { id: "tipo", label: "Tipo" },
  { id: "cliente", label: "Cliente" },
  { id: "pagador", label: "Pagador" },
  { id: "boleto", label: "Boleto" },
  { id: "extras", label: "Descontos/Juros" },
  { id: "mensagens", label: "Mensagens" },
  { id: "revisao", label: "Revisão" },
];

export default function CreateBoletoPage() {
  const router = useRouter();
  const { create, downloadPdf, loading } = useSicrediBoletos();
  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BoletoCreated | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  const form = useForm<BoletoFormValues>({
    resolver: zodResolver(boletoSchema) as any,
    mode: "onChange",
    defaultValues: {
      tipo_cobranca: "NORMAL",
      tipo_pessoa: "PESSOA_FISICA",
      documento: "",
      nome: "",
      endereco: "",
      cidade: "",
      uf: "",
      cep: "",
      email: "",
      telefone: "",
      especie_documento: "DUPLICATA_MERCANTIL_INDICACAO",
      data_vencimento: "",
      valor: "" as any,
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

  const watchedValues = form.watch();

  function handleClientSelect(clientId: string, clientData: ClientResponse) {
    setSelectedClient(clientData);
    
    const addr = (clientData.address as Record<string, string>) || {};
    const isPF = clientData.cpf_cnpj.length === 11;
    
    form.setValue("tipo_pessoa", isPF ? "PESSOA_FISICA" : "PESSOA_JURIDICA");
    form.setValue("documento", clientData.cpf_cnpj.replace(/\D/g, ""));
    form.setValue("nome", clientData.full_name);
    form.setValue("email", clientData.email || "");
    form.setValue("telefone", clientData.phone.replace(/\D/g, "") || "");
    form.setValue("endereco", addr.street ? `${addr.street}, ${addr.number || "S/N"}` : "");
    form.setValue("cidade", addr.city || "");
    form.setValue("uf", addr.state || "");
    form.setValue("cep", addr.zip?.replace(/\D/g, "") || "");
    
    toast.success(`Cliente ${clientData.full_name} selecionado`);
  }

  function handleCreateNewClient() {
    setClientFormOpen(true);
  }

  function handleClientCreated() {
    setClientFormOpen(false);
    toast.success("Cliente cadastrado com sucesso! Selecione-o na lista.");
  }

  async function handleNext() {
    let fieldsToValidate: (keyof BoletoFormValues)[] = [];
    
    if (step === 0) {
      fieldsToValidate = ["tipo_cobranca"];
    } else if (step === 1) {
      if (!selectedClient) {
        toast.error("Por favor, selecione um cliente");
        return;
      }
    } else if (step === 2) {
      fieldsToValidate = ["tipo_pessoa", "documento", "nome", "endereco", "cidade", "uf", "cep"];
    } else if (step === 3) {
      fieldsToValidate = ["especie_documento", "data_vencimento", "valor", "seu_numero"];
    }
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }
    }
    
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  async function onSubmit(data: BoletoFormValues) {
    if (!selectedClient) {
      toast.error("Por favor, selecione um cliente");
      return;
    }
    
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de continuar");
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmCreate() {
    if (!selectedClient) {
      toast.error("Cliente não selecionado");
      return;
    }

    const values = form.getValues();
    const payload: CreateBoletoRequest = {
      client_id: selectedClient.id,
      tipo_cobranca: values.tipo_cobranca as TipoCobranca,
      pagador: {
        tipo_pessoa: values.tipo_pessoa as "PESSOA_FISICA" | "PESSOA_JURIDICA",
        documento: values.documento,
        nome: values.nome,
        endereco: values.endereco,
        cidade: values.cidade,
        uf: values.uf,
        cep: values.cep,
        email: values.email || undefined,
        telefone: values.telefone || undefined,
      },
      especie_documento: values.especie_documento as EspecieDocumento,
      data_vencimento: values.data_vencimento,
      valor: values.valor,
      seu_numero: values.seu_numero,
    };

    if (values.tipo_desconto && values.tipo_desconto !== "ISENTO") {
      payload.tipo_desconto = values.tipo_desconto as TipoDesconto;
      if (values.valor_desconto_1) payload.valor_desconto_1 = values.valor_desconto_1;
      if (values.data_desconto_1) payload.data_desconto_1 = values.data_desconto_1;
    }

    if (values.tipo_juros && values.tipo_juros !== "ISENTO") {
      payload.tipo_juros = values.tipo_juros as TipoJuros;
      if (values.juros) payload.juros = values.juros;
    }

    if (values.tipo_multa && values.tipo_multa !== "ISENTO") {
      payload.tipo_multa = values.tipo_multa as TipoMulta;
      if (values.multa) payload.multa = values.multa;
    }

    if (values.informativos?.trim()) {
      payload.informativos = values.informativos
        .split("\n")
        .filter((l) => l.trim());
    }
    if (values.mensagens?.trim()) {
      payload.mensagens = values.mensagens
        .split("\n")
        .filter((l) => l.trim());
    }

    const boleto = await create(payload);
    setConfirmOpen(false);

    if (boleto) {
      setResult(boleto);
      toast.success("Boleto criado com sucesso!");
    } else {
      toast.error("Erro ao criar boleto");
    }
  }

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleDownloadPdf() {
    if (!result) return;
    await downloadPdf(result.linha_digitavel, `boleto_${result.nosso_numero}.pdf`);
  }

  // ---- Result Screen ----
  if (result) {
    return (
      <div className="space-y-6">
        <PageHeader title="Boleto Criado" description="O boleto foi gerado com sucesso" />

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados do Boleto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nosso Número</p>
              <p className="font-mono font-semibold">{result.nosso_numero}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Linha Digitável</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted p-2 text-sm font-mono break-all">
                  {result.linha_digitavel}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(result.linha_digitavel, "linha")
                  }
                >
                  {copiedField === "linha" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Código de Barras</p>
              <code className="block rounded bg-muted p-2 text-sm font-mono break-all">
                {result.codigo_barras}
              </code>
            </div>

            {result.qr_code && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  QR Code Pix (Copia e Cola)
                </p>
                <div className="flex flex-col items-center gap-3 rounded-lg border p-4 bg-white">
                  <QRCodeSVG value={result.qr_code} size={200} />
                  <div className="flex items-center gap-2 w-full">
                    <code className="flex-1 rounded bg-muted p-2 text-xs font-mono break-all max-h-20 overflow-y-auto">
                      {result.qr_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(result.qr_code!, "pix")
                      }
                    >
                      {copiedField === "pix" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleDownloadPdf} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setStep(0);
                  form.reset();
                }}
              >
                Criar Novo Boleto
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/sicredi/boletos")}
              >
                Ver Lista de Boletos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Wizard Form ----
  return (
    <div className="space-y-6">
      <PageHeader title="Novo Boleto" description="Preencha os dados para gerar um novo boleto Sicredi">
        <Button variant="outline" onClick={() => router.push("/admin/sicredi/boletos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </PageHeader>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-4 bg-border" />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              {/* Step 0: Tipo */}
              {step === 0 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Tipo de Boleto</CardTitle>
                  <FormField
                    control={form.control}
                    name="tipo_cobranca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cobrança</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => field.onChange("NORMAL")}
                            className={`rounded-lg border-2 p-4 text-left transition-colors ${
                              field.value === "NORMAL"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <p className="font-semibold text-sm">Boleto Tradicional</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Boleto bancário padrão com código de barras
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("HIBRIDO")}
                            className={`rounded-lg border-2 p-4 text-left transition-colors ${
                              field.value === "HIBRIDO"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <p className="font-semibold text-sm">Boleto Híbrido (Pix)</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Boleto com QR Code Pix para pagamento instantâneo
                            </p>
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 1: Cliente */}
              {step === 1 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Selecionar Cliente</CardTitle>
                  <CardDescription>
                    Selecione um cliente existente ou cadastre um novo. Os dados do cliente serão usados para preencher automaticamente as informações do pagador.
                  </CardDescription>
                  
                  <ClientSelector
                    value={selectedClient?.id || null}
                    onChange={handleClientSelect}
                    onCreateNew={handleCreateNewClient}
                  />
                  
                  {selectedClient && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="text-sm font-semibold mb-2">Cliente Selecionado:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Nome:</span> {selectedClient.full_name}</p>
                        <p><span className="text-muted-foreground">CPF/CNPJ:</span> {selectedClient.cpf_cnpj}</p>
                        <p><span className="text-muted-foreground">Email:</span> {selectedClient.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Pagador */}
              {step === 2 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Dados do Pagador</CardTitle>
                  {selectedClient && (
                    <Badge variant="outline" className="mb-2">
                      Dados preenchidos do cliente: {selectedClient.full_name}
                    </Badge>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tipo_pessoa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Pessoa</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PESSOA_FISICA">Pessoa Física</SelectItem>
                              <SelectItem value="PESSOA_JURIDICA">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                          </Select>
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
                            {watchedValues.tipo_pessoa === "PESSOA_FISICA" ? "CPF" : "CNPJ"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                watchedValues.tipo_pessoa === "PESSOA_FISICA"
                                  ? "00000000000"
                                  : "00000000000000"
                              }
                              maxLength={
                                watchedValues.tipo_pessoa === "PESSOA_FISICA" ? 11 : 14
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do pagador" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Rua, número, complemento" />
                          </FormControl>
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
                          <FormControl>
                            <Input {...field} placeholder="Cidade" />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00000000" maxLength={8} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@exemplo.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="51999999999" maxLength={11} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Dados do Boleto */}
              {step === 3 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Dados do Boleto</CardTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value as number | undefined}
                              onChange={(v) => field.onChange(v ?? 0)}
                              placeholder="150,00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_vencimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="seu_numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seu Número (Controle Interno)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="INV-12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="especie_documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Espécie do Documento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ESPECIE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Descontos/Juros/Multa */}
              {step === 4 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Descontos, Juros e Multa</CardTitle>
                  <CardDescription>Campos opcionais. Deixe como "Isento" para não aplicar.</CardDescription>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tipo_desconto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Desconto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
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
                    {watchedValues.tipo_desconto !== "ISENTO" && (
                      <>
                        <FormField
                          control={form.control}
                          name="valor_desconto_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Desconto</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" placeholder="10.00" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="data_desconto_1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data Limite do Desconto</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    <FormField
                      control={form.control}
                      name="tipo_juros"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Juros</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ISENTO">Isento</SelectItem>
                              <SelectItem value="VALOR_DIA">Valor por Dia</SelectItem>
                              <SelectItem value="PERCENTUAL_MES">Percentual ao Mês</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchedValues.tipo_juros !== "ISENTO" && (
                      <FormField
                        control={form.control}
                        name="juros"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor dos Juros</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="0.50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="tipo_multa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Multa</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
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
                    {watchedValues.tipo_multa !== "ISENTO" && (
                      <FormField
                        control={form.control}
                        name="multa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Multa</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" placeholder="2.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Mensagens */}
              {step === 5 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Mensagens e Informativos</CardTitle>
                  <CardDescription>Campos opcionais. Cada linha será uma mensagem separada.</CardDescription>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="informativos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informativos</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Pagamento referente a serviços&#10;Uma linha por mensagem"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mensagens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagens (instruções de pagamento)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Após vencimento cobrar multa de 2%&#10;Uma linha por mensagem"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Revisão */}
              {step === 6 && (
                <div className="space-y-4">
                  <CardTitle className="text-base">Revisão do Boleto</CardTitle>
                  <CardDescription>Verifique todos os dados antes de confirmar a criação.</CardDescription>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-semibold">Tipo</p>
                      <Badge variant={watchedValues.tipo_cobranca === "HIBRIDO" ? "default" : "secondary"}>
                        {watchedValues.tipo_cobranca === "HIBRIDO" ? "Híbrido (Pix)" : "Tradicional"}
                      </Badge>
                    </div>

                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-semibold">Valor</p>
                      <p className="text-lg font-bold">{formatCurrency(watchedValues.valor || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {watchedValues.data_vencimento || "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4 space-y-1 sm:col-span-2">
                      <p className="text-sm font-semibold">Pagador</p>
                      <p className="text-sm">{watchedValues.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {watchedValues.tipo_pessoa === "PESSOA_FISICA" ? "CPF" : "CNPJ"}: {watchedValues.documento}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {watchedValues.endereco}, {watchedValues.cidade} - {watchedValues.uf}, CEP: {watchedValues.cep}
                      </p>
                      {watchedValues.email && (
                        <p className="text-xs text-muted-foreground">{watchedValues.email}</p>
                      )}
                    </div>

                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm font-semibold">Controle</p>
                      <p className="text-sm">Seu Número: {watchedValues.seu_numero}</p>
                      <p className="text-xs text-muted-foreground">
                        Espécie: {ESPECIE_OPTIONS.find((e) => e.value === watchedValues.especie_documento)?.label}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4 space-y-1">
                      <p className="text-sm font-semibold">Encargos</p>
                      <p className="text-xs">Desconto: {watchedValues.tipo_desconto === "ISENTO" ? "Isento" : `${watchedValues.valor_desconto_1}`}</p>
                      <p className="text-xs">Juros: {watchedValues.tipo_juros === "ISENTO" ? "Isento" : `${watchedValues.juros}`}</p>
                      <p className="text-xs">Multa: {watchedValues.tipo_multa === "ISENTO" ? "Isento" : `${watchedValues.multa}`}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={step === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando boleto...
                      </>
                    ) : (
                      "Criar Boleto"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar Criação de Boleto"
        description={`Você está prestes a gerar um boleto no valor de ${formatCurrency(
          watchedValues.valor || 0
        )} para ${watchedValues.nome || "o pagador informado"}. Esta ação será enviada ao banco Sicredi. Deseja continuar?`}
        confirmLabel="Sim, Criar Boleto"
        loading={loading}
        onConfirm={handleConfirmCreate}
      />

      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        client={null}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}
