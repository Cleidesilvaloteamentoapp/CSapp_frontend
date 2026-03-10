"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  CalendarRange,
  DollarSign,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { ClientSelector } from "@/components/sicredi/client-selector";
import { ClientFormDialog } from "@/app/admin/clients/client-form-dialog";
import { BatchProgressDialog } from "@/components/sicredi/batch-progress-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { formatCurrency, formatDate } from "@/lib/format";
import { FREQ_MONTHS } from "@/types/sicredi";
import type {
  BatchFrequency,
  BatchCreateRequest,
  TipoJuros,
  TipoMulta,
} from "@/types/sicredi";
import type { ClientResponse } from "@/types";

const FREQ_OPTIONS: { value: BatchFrequency; label: string }[] = [
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral (3 meses)" },
  { value: "SEMESTRAL", label: "Semestral (6 meses)" },
  { value: "ANUAL", label: "Anual (12 meses)" },
];

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

interface InstallmentPreview {
  index: number;
  dueDate: string;
  value: number;
}

export default function BatchCreatePage() {
  const router = useRouter();
  const { createBatch, loading } = useSicrediBoletos();

  // Client
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  // Batch params
  const [valor, setValor] = useState("");
  const [frequency, setFrequency] = useState<BatchFrequency>("MENSAL");
  const [durationMonths, setDurationMonths] = useState("12");
  const [dataInicio, setDataInicio] = useState("");
  const [tipoJuros, setTipoJuros] = useState<TipoJuros>("ISENTO");
  const [juros, setJuros] = useState("");
  const [tipoMulta, setTipoMulta] = useState<TipoMulta>("ISENTO");
  const [multa, setMulta] = useState("");
  const [diasNegativacao, setDiasNegativacao] = useState("");

  // Pagador overrides (auto-filled from client)
  const [pagadorNome, setPagadorNome] = useState("");
  const [pagadorDocumento, setPagadorDocumento] = useState("");
  const [pagadorEndereco, setPagadorEndereco] = useState("");
  const [pagadorCidade, setPagadorCidade] = useState("");
  const [pagadorUf, setPagadorUf] = useState("");
  const [pagadorCep, setPagadorCep] = useState("");

  // Batch progress
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);

  // Installment preview
  const installments = useMemo<InstallmentPreview[]>(() => {
    if (!dataInicio || !valor || !durationMonths) return [];
    const val = parseFloat(valor);
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
  }, [dataInicio, valor, durationMonths, frequency]);

  const totalValue = installments.reduce((sum, i) => sum + i.value, 0);

  function handleClientSelect(_id: string, client: ClientResponse) {
    setSelectedClient(client);
    const addr = (client.address as Record<string, string>) || {};
    const isPF = client.cpf_cnpj.replace(/\D/g, "").length <= 11;

    setPagadorNome(client.full_name);
    setPagadorDocumento(client.cpf_cnpj.replace(/\D/g, ""));
    setPagadorEndereco(addr.street ? `${addr.street}, ${addr.number || "S/N"}` : "");
    setPagadorCidade(addr.city || "");
    setPagadorUf(addr.state || "");
    setPagadorCep(addr.zip?.replace(/\D/g, "") || "");
    toast.success(`Cliente ${client.full_name} selecionado`);
  }

  const canSubmit =
    selectedClient &&
    parseFloat(valor) > 0 &&
    parseInt(durationMonths) > 0 &&
    dataInicio &&
    pagadorNome &&
    pagadorDocumento &&
    pagadorEndereco &&
    pagadorCidade &&
    pagadorUf &&
    pagadorCep;

  async function handleSubmit() {
    if (!selectedClient || !canSubmit) return;

    const isPF = pagadorDocumento.length <= 11;

    const payload: BatchCreateRequest = {
      client_id: selectedClient.id,
      pagador: {
        tipo_pessoa: isPF ? "PESSOA_FISICA" : "PESSOA_JURIDICA",
        documento: pagadorDocumento,
        nome: pagadorNome,
        endereco: pagadorEndereco,
        cidade: pagadorCidade,
        uf: pagadorUf,
        cep: pagadorCep,
      },
      valor: parseFloat(valor),
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
    } else {
      toast.error("Erro ao criar lote de boletos");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criação de Boletos em Lote"
        description="Gere múltiplos boletos de uma vez com base em parcelas recorrentes"
      >
        <Button
          variant="outline"
          onClick={() => router.push("/admin/sicredi/boletos")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Selecionar Cliente</CardTitle>
            <CardDescription>
              Os dados do pagador serão preenchidos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ClientSelector
              value={selectedClient?.id || null}
              onChange={handleClientSelect}
              onCreateNew={() => setClientFormOpen(true)}
            />
            {selectedClient && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-semibold">{selectedClient.full_name}</p>
                <p className="text-muted-foreground">
                  {selectedClient.cpf_cnpj} &bull; {selectedClient.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuração do lote */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              2. Configuração das Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor por Parcela (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="500.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as BatchFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQ_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração (meses)</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Primeiro Vencimento</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Negativação Automática (dias, opcional)</Label>
              <Input
                type="number"
                min="0"
                value={diasNegativacao}
                onChange={(e) => setDiasNegativacao(e.target.value)}
                placeholder="Ex: 30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Juros e Multa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              3. Juros e Multa (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Juros</Label>
                <Select value={tipoJuros} onValueChange={(v) => setTipoJuros(v as TipoJuros)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                    placeholder="2.00"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Tipo de Multa</Label>
                <Select value={tipoMulta} onValueChange={(v) => setTipoMulta(v as TipoMulta)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={multa}
                    onChange={(e) => setMulta(e.target.value)}
                    placeholder="2.00"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Pagador */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Dados do Pagador</CardTitle>
            <CardDescription>
              Preenchidos automaticamente do cliente. Edite se necessário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Nome</Label>
                <Input value={pagadorNome} onChange={(e) => setPagadorNome(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>CPF/CNPJ</Label>
                <Input value={pagadorDocumento} onChange={(e) => setPagadorDocumento(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>CEP</Label>
                <Input value={pagadorCep} onChange={(e) => setPagadorCep(e.target.value)} maxLength={8} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={pagadorEndereco} onChange={(e) => setPagadorEndereco(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input value={pagadorCidade} onChange={(e) => setPagadorCidade(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>UF</Label>
                <Select value={pagadorUf} onValueChange={setPagadorUf}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_OPTIONS.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview de parcelas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Prévia das Parcelas
              </CardTitle>
              {installments.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline">{installments.length} parcelas</Badge>
                  <span className="font-semibold">{formatCurrency(totalValue)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {installments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Preencha valor, frequência, duração e data de início para visualizar a prévia.
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
                        <TableCell>{formatDate(inst.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inst.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/sicredi/boletos")}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          size="lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarRange className="mr-2 h-4 w-4" />
          )}
          Criar {installments.length} Boletos em Lote
        </Button>
      </div>

      {/* Dialogs */}
      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        client={null}
        onSuccess={() => {
          setClientFormOpen(false);
          toast.success("Cliente criado. Selecione-o na lista.");
        }}
      />

      <BatchProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        batchId={batchId}
        onComplete={() => router.push("/admin/sicredi/boletos")}
      />
    </div>
  );
}
