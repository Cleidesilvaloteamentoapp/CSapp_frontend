"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Ban,
  Calendar,
  Percent,
  DollarSign,
  Hash,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ShieldOff,
  User,
  Mail,
  Phone,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ClientSelector } from "@/components/sicredi/client-selector";
import { ClientFormDialog } from "@/app/admin/clients/client-form-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { updateBoleto } from "@/services/sicredi";
import { formatCurrency, formatDate, formatCpfCnpj } from "@/lib/format";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_CONFIG } from "@/types/sicredi";
import type { Boleto, BoletoDetails } from "@/types/sicredi";
import { TAG_CONFIG, type BoletoTag } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { manualBoletoWriteoff } from "@/services/admin";

export default function BoletoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const nossoNumero = params.nossoNumero as string;

  const {
    fetchBoleto,
    fetchBoletoLocalByNN,
    cancel,
    updateVencimento,
    updateDesconto,
    updateJuros,
    updateSeuNumero,
    grantAbatimento,
    revokeAbatimento,
    negativar,
    sustarNegativacao,
    downloadPdf,
    loading,
  } = useSicrediBoletos();

  const [boletoLocal, setBoletoLocal] = useState<Boleto | null>(null);
  const [boletoSicredi, setBoletoSicredi] = useState<BoletoDetails | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dialog states
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [vencimentoOpen, setVencimentoOpen] = useState(false);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [jurosOpen, setJurosOpen] = useState(false);
  const [abatimentoOpen, setAbatimentoOpen] = useState(false);
  const [seuNumeroOpen, setSeuNumeroOpen] = useState(false);
  const [negativarOpen, setNegativarOpen] = useState(false);
  const [sustarOpen, setSustarOpen] = useState(false);
  const [linkClientOpen, setLinkClientOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [baixaManualOpen, setBaixaManualOpen] = useState(false);
  const [baixaReason, setBaixaReason] = useState("");
  const [baixaValor, setBaixaValor] = useState("");
  const [baixaData, setBaixaData] = useState("");
  const [baixaLoading, setBaixaLoading] = useState(false);

  // Form values
  const [newVencimento, setNewVencimento] = useState("");
  const [newDesconto, setNewDesconto] = useState("");
  const [newJuros, setNewJuros] = useState("");
  const [newAbatimento, setNewAbatimento] = useState("");
  const [newSeuNumero, setNewSeuNumero] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [local, sicredi] = await Promise.all([
        fetchBoletoLocalByNN(nossoNumero),
        fetchBoleto(nossoNumero),
      ]);
      setBoletoLocal(local);
      setBoletoSicredi(sicredi);
      setPageLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nossoNumero]);

  async function handleSyncSicredi() {
    setSyncLoading(true);
    const data = await fetchBoleto(nossoNumero);
    setBoletoSicredi(data);
    setSyncLoading(false);
    if (data) {
      toast.success("Dados atualizados do Sicredi");
    } else {
      toast.error("Erro ao consultar Sicredi");
    }
  }

  async function reloadLocal() {
    const local = await fetchBoletoLocalByNN(nossoNumero);
    setBoletoLocal(local);
  }

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  }

  const boleto = boletoLocal || boletoSicredi;
  const linhaDigitavel = boletoLocal?.linha_digitavel || boletoSicredi?.linha_digitavel || "";
  const codigoBarras = boletoLocal?.codigo_barras || boletoSicredi?.codigo_barras || "";
  const valor = boletoLocal?.valor ?? boletoSicredi?.valor ?? 0;
  const dataVencimento = boletoLocal?.data_vencimento || boletoSicredi?.data_vencimento || "";
  const tipoCobranca = boletoLocal?.tipo_cobranca || boletoSicredi?.tipo_cobranca || "NORMAL";
  const qrCode = boletoLocal?.qr_code || boletoSicredi?.qr_code;
  const txid = boletoLocal?.txid || boletoSicredi?.txid;
  const seuNumero = boletoLocal?.seu_numero || boletoSicredi?.seu_numero || "";
  const status = boletoLocal?.status || boletoSicredi?.situacao || "NORMAL";

  async function handleDownload() {
    if (!linhaDigitavel) return;
    await downloadPdf(linhaDigitavel, `boleto_${nossoNumero}.pdf`);
  }

  async function handleConfirmCancel() {
    setActionLoading(true);
    const success = await cancel(nossoNumero);
    setActionLoading(false);
    setCancelConfirmOpen(false);
    if (success) {
      toast.success("Boleto cancelado com sucesso");
      reloadLocal();
      handleSyncSicredi();
    } else {
      toast.error("Erro ao cancelar boleto");
    }
  }

  async function handleUpdateVencimento() {
    if (!newVencimento) return;
    setActionLoading(true);
    const success = await updateVencimento(nossoNumero, {
      data_vencimento: newVencimento,
    });
    setActionLoading(false);
    setVencimentoOpen(false);
    if (success) {
      toast.success("Vencimento alterado");
      setNewVencimento("");
      reloadLocal();
    } else {
      toast.error("Erro ao alterar vencimento");
    }
  }

  async function handleUpdateDesconto() {
    setActionLoading(true);
    const success = await updateDesconto(nossoNumero, {
      valor_desconto_1: newDesconto ? parseFloat(newDesconto) : null,
    });
    setActionLoading(false);
    setDescontoOpen(false);
    if (success) {
      toast.success("Desconto alterado");
      setNewDesconto("");
    } else {
      toast.error("Erro ao alterar desconto");
    }
  }

  async function handleUpdateJuros() {
    if (!newJuros) return;
    setActionLoading(true);
    const success = await updateJuros(nossoNumero, {
      valor_ou_percentual: newJuros,
    });
    setActionLoading(false);
    setJurosOpen(false);
    if (success) {
      toast.success("Juros alterados");
      setNewJuros("");
    } else {
      toast.error("Erro ao alterar juros");
    }
  }

  async function handleGrantAbatimento() {
    if (!newAbatimento) return;
    setActionLoading(true);
    const success = await grantAbatimento(nossoNumero, {
      valor_abatimento: parseFloat(newAbatimento),
    });
    setActionLoading(false);
    setAbatimentoOpen(false);
    if (success) {
      toast.success("Abatimento concedido");
      setNewAbatimento("");
    } else {
      toast.error("Erro ao conceder abatimento");
    }
  }

  async function handleRevokeAbatimento() {
    setActionLoading(true);
    const success = await revokeAbatimento(nossoNumero);
    setActionLoading(false);
    if (success) toast.success("Abatimento cancelado");
    else toast.error("Erro ao cancelar abatimento");
  }

  async function handleUpdateSeuNumero() {
    if (!newSeuNumero) return;
    setActionLoading(true);
    const success = await updateSeuNumero(nossoNumero, {
      seu_numero: newSeuNumero,
    });
    setActionLoading(false);
    setSeuNumeroOpen(false);
    if (success) {
      toast.success("Seu Número alterado");
      setNewSeuNumero("");
      reloadLocal();
    } else {
      toast.error("Erro ao alterar Seu Número");
    }
  }

  async function handleNegativar() {
    setActionLoading(true);
    const success = await negativar(nossoNumero);
    setActionLoading(false);
    setNegativarOpen(false);
    if (success) {
      toast.success("Negativação incluída");
      reloadLocal();
      handleSyncSicredi();
    } else {
      toast.error("Erro ao incluir negativação");
    }
  }

  async function handleSustarNegativacao() {
    setActionLoading(true);
    const success = await sustarNegativacao(nossoNumero);
    setActionLoading(false);
    setSustarOpen(false);
    if (success) {
      toast.success("Negativação sustada e boleto baixado");
      reloadLocal();
      handleSyncSicredi();
    } else {
      toast.error("Erro ao sustar negativação");
    }
  }

  async function handleLinkClient(clientId: string) {
    if (!boletoLocal) return;
    setActionLoading(true);
    try {
      await updateBoleto(boletoLocal.id, { client_id: clientId });
      toast.success("Cliente vinculado ao boleto");
      setLinkClientOpen(false);
      reloadLocal();
    } catch {
      toast.error("Erro ao vincular cliente");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBaixaManual() {
    if (!boletoLocal || baixaReason.length < 5) return;
    setBaixaLoading(true);
    try {
      await manualBoletoWriteoff(boletoLocal.id, {
        reason: baixaReason,
        valor_liquidacao: baixaValor ? parseFloat(baixaValor) : undefined,
        data_liquidacao: baixaData || undefined,
      });
      toast.success("Baixa manual realizada com sucesso");
      setBaixaManualOpen(false);
      setBaixaReason("");
      setBaixaValor("");
      setBaixaData("");
      reloadLocal();
      handleSyncSicredi();
    } catch {
      toast.error("Erro ao realizar baixa manual");
    } finally {
      setBaixaLoading(false);
    }
  }

  if (pageLoading) return <PageSkeleton />;

  if (!boleto) {
    return (
      <div className="space-y-6">
        <PageHeader title="Boleto não encontrado" />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NORMAL;
  const isEditable = status !== "CANCELADO" && status !== "LIQUIDADO";
  const isNegativado = status === "NEGATIVADO";
  const isVencido = status === "VENCIDO";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title={`Boleto ${nossoNumero}`}
          description={`Seu Número: ${seuNumero}`}
        >
          <Button
            variant="outline"
            onClick={() => router.push("/admin/sicredi/boletos")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </PageHeader>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncSicredi}
          disabled={syncLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
          Consultar Sicredi
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados do Boleto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dados do Boleto</CardTitle>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Linha Digitável</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 rounded bg-muted p-2 text-xs font-mono break-all">
                  {linhaDigitavel}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(linhaDigitavel, "linha")}
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
              <code className="block rounded bg-muted p-2 text-xs font-mono break-all mt-1">
                {codigoBarras}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-lg font-bold">{formatCurrency(valor)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="text-lg font-semibold">{formatDate(dataVencimento)}</p>
              </div>
            </div>

            {boletoLocal?.data_emissao && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Emissão</p>
                  <p className="text-sm font-medium">{formatDate(boletoLocal.data_emissao)}</p>
                </div>
                {boletoLocal.data_liquidacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Liquidação</p>
                    <p className="text-sm font-medium">{formatDate(boletoLocal.data_liquidacao)}</p>
                  </div>
                )}
              </div>
            )}

            {boletoLocal?.valor_liquidacao != null && (
              <div>
                <p className="text-sm text-muted-foreground">Valor Liquidado</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(boletoLocal.valor_liquidacao)}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Cobrança</p>
                <Badge
                  variant={tipoCobranca === "HIBRIDO" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {tipoCobranca === "HIBRIDO" ? "Híbrido (Pix)" : "Tradicional"}
                </Badge>
              </div>
              {boletoLocal?.dias_negativacao_auto != null && (
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Negativação Auto</p>
                  <p className="text-sm font-medium">{boletoLocal.dias_negativacao_auto} dias</p>
                </div>
              )}
            </div>

            {/* Tag & Installment Label */}
            {(boletoLocal?.tag || boletoLocal?.installment_label) && (
              <div className="flex items-center gap-3 flex-wrap">
                {boletoLocal?.tag && TAG_CONFIG[boletoLocal.tag as BoletoTag] && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tag</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mt-1 ${TAG_CONFIG[boletoLocal.tag as BoletoTag].bg} ${TAG_CONFIG[boletoLocal.tag as BoletoTag].color}`}>
                      {TAG_CONFIG[boletoLocal.tag as BoletoTag].label}
                    </span>
                  </div>
                )}
                {boletoLocal?.installment_label && (
                  <div>
                    <p className="text-sm text-muted-foreground">Parcela</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">{boletoLocal.installment_label}</p>
                  </div>
                )}
              </div>
            )}

            {/* Writeoff Info */}
            {boletoLocal?.writeoff_type && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Tipo de Baixa</p>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                    boletoLocal.writeoff_type === "MANUAL_ADMIN"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {boletoLocal.writeoff_type === "MANUAL_ADMIN" ? "Baixa Manual" : "Baixa Automática (Banco)"}
                  </span>
                </div>
                {boletoLocal.writeoff_by && (
                  <div>
                    <p className="text-xs text-muted-foreground">Baixado por</p>
                    <p className="text-sm">{boletoLocal.writeoff_by}</p>
                  </div>
                )}
                {boletoLocal.writeoff_reason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Motivo</p>
                    <p className="text-sm bg-muted rounded p-2">{boletoLocal.writeoff_reason}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cliente / Pagador */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {boletoLocal?.client ? "Cliente Vinculado" : "Pagador"}
              </CardTitle>
              {boletoLocal && !boletoLocal.client_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkClientOpen(true)}
                >
                  <UserPlus className="mr-2 h-3 w-3" />
                  Vincular
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {boletoLocal?.client ? (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{boletoLocal.client.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-mono">{formatCpfCnpj(boletoLocal.client.cpf_cnpj)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="text-sm">{boletoLocal.client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="text-sm">{boletoLocal.client.phone}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">
                    {boletoLocal?.pagador_nome || boletoSicredi?.pagador?.nome || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p className="font-mono">
                    {formatCpfCnpj(
                      boletoLocal?.pagador_documento || boletoSicredi?.pagador?.documento || ""
                    )}
                  </p>
                </div>
                {!boletoLocal?.client_id && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Este boleto não está vinculado a um cliente cadastrado.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Code Pix */}
        {qrCode && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">QR Code Pix</CardTitle>
              <CardDescription>
                Escaneie o QR Code ou copie o código Pix Copia e Cola
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="rounded-lg border bg-white p-4">
                  <QRCodeSVG value={qrCode} size={180} />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">Pix Copia e Cola</p>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 rounded bg-muted p-2 text-xs font-mono break-all max-h-28 overflow-y-auto">
                      {qrCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(qrCode, "pix")}
                    >
                      {copiedField === "pix" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {txid && (
                    <div>
                      <p className="text-sm text-muted-foreground">TXID</p>
                      <p className="text-xs font-mono">{txid}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
            <CardDescription>
              Ações disponíveis com base no status atual do boleto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar PDF
              </Button>

              {isEditable && !isNegativado && (
                <>
                  <Separator orientation="vertical" className="h-9" />
                  <Button
                    variant="outline"
                    onClick={() => { setNewVencimento(""); setVencimentoOpen(true); }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Alterar Vencimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setNewDesconto(""); setDescontoOpen(true); }}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Alterar Desconto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setNewJuros(""); setJurosOpen(true); }}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Alterar Juros
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setNewAbatimento(""); setAbatimentoOpen(true); }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Conceder Abatimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRevokeAbatimento}
                    disabled={actionLoading}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Cancelar Abatimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setNewSeuNumero(seuNumero); setSeuNumeroOpen(true); }}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    Alterar Seu Número
                  </Button>
                </>
              )}

              {isVencido && (
                <>
                  <Separator orientation="vertical" className="h-9" />
                  <Button
                    variant="destructive"
                    onClick={() => setNegativarOpen(true)}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Incluir Negativação
                  </Button>
                </>
              )}

              {isNegativado && (
                <>
                  <Separator orientation="vertical" className="h-9" />
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => setSustarOpen(true)}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Sustar Negativação + Baixar
                  </Button>
                </>
              )}

              {isEditable && isSuperAdmin && !boletoLocal?.writeoff_type && (
                <>
                  <Separator orientation="vertical" className="h-9" />
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setBaixaReason("");
                      setBaixaValor(String(valor));
                      setBaixaData("");
                      setBaixaManualOpen(true);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Baixa Manual
                  </Button>
                </>
              )}

              {isEditable && (
                <>
                  <Separator orientation="vertical" className="h-9" />
                  <Button
                    variant="destructive"
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancelar Boleto
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== Dialogs ==================== */}

      <ConfirmationDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancelar Boleto"
        description={`Tem certeza que deseja cancelar (dar baixa) no boleto ${nossoNumero}? Esta ação será enviada ao banco Sicredi e não pode ser desfeita.`}
        confirmLabel="Sim, Cancelar Boleto"
        destructive
        loading={actionLoading}
        onConfirm={handleConfirmCancel}
      />

      <Dialog open={vencimentoOpen} onOpenChange={setVencimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Data de Vencimento</DialogTitle>
            <DialogDescription>Esta alteração será enviada ao banco Sicredi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nova Data de Vencimento</label>
              <Input
                type="date"
                value={newVencimento}
                onChange={(e) => setNewVencimento(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVencimentoOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateVencimento} disabled={actionLoading || !newVencimento}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Desconto</DialogTitle>
            <DialogDescription>Deixe vazio para remover o desconto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor do Desconto (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newDesconto}
                onChange={(e) => setNewDesconto(e.target.value)}
                placeholder="10.00"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDescontoOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateDesconto} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={jurosOpen} onOpenChange={setJurosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Juros</DialogTitle>
            <DialogDescription>Informe o novo valor ou percentual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor ou Percentual</label>
              <Input
                type="text"
                value={newJuros}
                onChange={(e) => setNewJuros(e.target.value)}
                placeholder="2.50"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setJurosOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateJuros} disabled={actionLoading || !newJuros}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={abatimentoOpen} onOpenChange={setAbatimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Abatimento</DialogTitle>
            <DialogDescription>Informe o valor do abatimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valor do Abatimento (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={newAbatimento}
                onChange={(e) => setNewAbatimento(e.target.value)}
                placeholder="5.00"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAbatimentoOpen(false)}>Cancelar</Button>
              <Button onClick={handleGrantAbatimento} disabled={actionLoading || !newAbatimento}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={seuNumeroOpen} onOpenChange={setSeuNumeroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Seu Número</DialogTitle>
            <DialogDescription>Esta alteração será enviada ao banco Sicredi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Novo Seu Número</label>
              <Input
                value={newSeuNumero}
                onChange={(e) => setNewSeuNumero(e.target.value)}
                placeholder="INV-12345"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSeuNumeroOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateSeuNumero} disabled={actionLoading || !newSeuNumero}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={negativarOpen}
        onOpenChange={setNegativarOpen}
        title="Incluir Negativação"
        description={`Tem certeza que deseja incluir negativação para o boleto ${nossoNumero}? O pagador será registrado nos órgãos de proteção ao crédito.`}
        confirmLabel="Sim, Negativar"
        destructive
        loading={actionLoading}
        onConfirm={handleNegativar}
      />

      <ConfirmationDialog
        open={sustarOpen}
        onOpenChange={setSustarOpen}
        title="Sustar Negativação e Baixar Título"
        description={`Tem certeza que deseja sustar a negativação e dar baixa no boleto ${nossoNumero}?`}
        confirmLabel="Sim, Sustar e Baixar"
        destructive
        loading={actionLoading}
        onConfirm={handleSustarNegativacao}
      />

      <Dialog open={linkClientOpen} onOpenChange={setLinkClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Cliente ao Boleto</DialogTitle>
            <DialogDescription>
              Pagador: {boletoLocal?.pagador_nome || boletoSicredi?.pagador?.nome}
            </DialogDescription>
          </DialogHeader>
          <ClientSelector
            value={null}
            onChange={(clientId) => handleLinkClient(clientId)}
            onCreateNew={() => {
              setLinkClientOpen(false);
              setClientFormOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        client={null}
        onSuccess={() => {
          setClientFormOpen(false);
          toast.success("Cliente criado com sucesso");
        }}
      />

      {/* Baixa Manual Dialog */}
      <Dialog open={baixaManualOpen} onOpenChange={setBaixaManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixa Manual do Boleto</DialogTitle>
            <DialogDescription>
              Boleto: {nossoNumero} — Esta ação registra a baixa manual sem comunicação com o banco.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da Baixa *</label>
              <Textarea
                value={baixaReason}
                onChange={(e) => setBaixaReason(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Mínimo 5 caracteres..."
              />
              {baixaReason.length > 0 && baixaReason.length < 5 && (
                <p className="text-xs text-destructive mt-1">Mínimo 5 caracteres</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Valor Liquidado (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={baixaValor}
                onChange={(e) => setBaixaValor(e.target.value)}
                className="mt-1"
                placeholder="Opcional — valor efetivamente pago"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data de Liquidação</label>
              <Input
                type="date"
                value={baixaData}
                onChange={(e) => setBaixaData(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBaixaManualOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleBaixaManual}
                disabled={baixaLoading || baixaReason.length < 5}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {baixaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Baixa Manual
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
