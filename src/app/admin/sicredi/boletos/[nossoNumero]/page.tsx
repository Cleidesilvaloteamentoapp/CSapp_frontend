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
  Loader2,
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
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useSicrediBoletos } from "@/hooks/use-sicredi";
import { formatCurrency, formatDate, formatCpfCnpj } from "@/lib/format";
import type { BoletoDetails } from "@/types/sicredi";

const SITUACAO_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NORMAL: { label: "Em Aberto", variant: "outline" },
  EM_ABERTO: { label: "Em Aberto", variant: "outline" },
  LIQUIDADO: { label: "Liquidado", variant: "default" },
  VENCIDO: { label: "Vencido", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
};

export default function BoletoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const nossoNumero = params.nossoNumero as string;

  const {
    fetchBoleto,
    cancel,
    updateVencimento,
    updateDesconto,
    updateJuros,
    grantAbatimento,
    revokeAbatimento,
    downloadPdf,
    loading,
  } = useSicrediBoletos();

  const [boleto, setBoleto] = useState<BoletoDetails | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dialog states
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [vencimentoOpen, setVencimentoOpen] = useState(false);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [jurosOpen, setJurosOpen] = useState(false);
  const [abatimentoOpen, setAbatimentoOpen] = useState(false);

  // Form values for dialogs
  const [newVencimento, setNewVencimento] = useState("");
  const [newDesconto, setNewDesconto] = useState("");
  const [newJuros, setNewJuros] = useState("");
  const [newAbatimento, setNewAbatimento] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchBoleto(nossoNumero);
      setBoleto(data);
      setPageLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nossoNumero]);

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleDownload() {
    if (!boleto) return;
    await downloadPdf(boleto.linha_digitavel, `boleto_${boleto.nosso_numero}.pdf`);
  }

  async function handleConfirmCancel() {
    setActionLoading(true);
    const success = await cancel(nossoNumero);
    setActionLoading(false);
    setCancelConfirmOpen(false);
    if (success) {
      toast.success("Boleto cancelado com sucesso");
      setBoleto((prev) => (prev ? { ...prev, situacao: "CANCELADO" } : prev));
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
      toast.success("Vencimento alterado com sucesso");
      setBoleto((prev) =>
        prev ? { ...prev, data_vencimento: newVencimento } : prev
      );
      setNewVencimento("");
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
      toast.success("Desconto alterado com sucesso");
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
      toast.success("Juros alterados com sucesso");
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
      toast.success("Abatimento concedido com sucesso");
      setNewAbatimento("");
    } else {
      toast.error("Erro ao conceder abatimento");
    }
  }

  async function handleRevokeAbatimento() {
    setActionLoading(true);
    const success = await revokeAbatimento(nossoNumero);
    setActionLoading(false);
    if (success) {
      toast.success("Abatimento cancelado");
    } else {
      toast.error("Erro ao cancelar abatimento");
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

  const sit = SITUACAO_BADGE[boleto.situacao] || SITUACAO_BADGE.NORMAL;
  const isEditable =
    boleto.situacao !== "CANCELADO" && boleto.situacao !== "LIQUIDADO";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Boleto ${boleto.nosso_numero}`}
        description={`Seu Número: ${boleto.seu_numero}`}
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
        {/* Informações do Boleto */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Dados do Boleto</CardTitle>
              <Badge variant={sit.variant}>{sit.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Linha Digitável</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 rounded bg-muted p-2 text-xs font-mono break-all">
                  {boleto.linha_digitavel}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(boleto.linha_digitavel, "linha")}
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
                {boleto.codigo_barras}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-lg font-bold">
                  {formatCurrency(boleto.valor)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="text-lg font-semibold">
                  {formatDate(boleto.data_vencimento)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tipo de Cobrança</p>
              <Badge
                variant={
                  boleto.tipo_cobranca === "HIBRIDO" ? "default" : "secondary"
                }
                className="mt-1"
              >
                {boleto.tipo_cobranca === "HIBRIDO"
                  ? "Híbrido (Pix)"
                  : "Tradicional"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Pagador */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{boleto.pagador.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {boleto.pagador.tipoPessoa === "PESSOA_FISICA"
                  ? "CPF"
                  : "CNPJ"}
              </p>
              <p className="font-mono">
                {formatCpfCnpj(boleto.pagador.documento)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Pix */}
        {boleto.qr_code && (
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
                  <QRCodeSVG value={boleto.qr_code} size={180} />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Pix Copia e Cola
                  </p>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 rounded bg-muted p-2 text-xs font-mono break-all max-h-28 overflow-y-auto">
                      {boleto.qr_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(boleto.qr_code!, "pix")}
                    >
                      {copiedField === "pix" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {boleto.txid && (
                    <div>
                      <p className="text-sm text-muted-foreground">TXID</p>
                      <p className="text-xs font-mono">{boleto.txid}</p>
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
              Todas as ações requerem confirmação antes de serem enviadas ao
              banco
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

              {isEditable && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setVencimentoOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Alterar Vencimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDescontoOpen(true)}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Alterar Desconto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setJurosOpen(true)}
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Alterar Juros
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAbatimentoOpen(true)}
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

      {/* Cancel Confirmation */}
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

      {/* Alterar Vencimento Dialog */}
      <Dialog open={vencimentoOpen} onOpenChange={setVencimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Data de Vencimento</DialogTitle>
            <DialogDescription>
              Esta alteração será enviada ao banco Sicredi.
            </DialogDescription>
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
              <Button variant="outline" onClick={() => setVencimentoOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateVencimento}
                disabled={actionLoading || !newVencimento}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alterar Desconto Dialog */}
      <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Desconto</DialogTitle>
            <DialogDescription>
              Esta alteração será enviada ao banco Sicredi. Deixe vazio para
              remover o desconto.
            </DialogDescription>
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
              <Button variant="outline" onClick={() => setDescontoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDesconto} disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alterar Juros Dialog */}
      <Dialog open={jurosOpen} onOpenChange={setJurosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Juros</DialogTitle>
            <DialogDescription>
              Informe o novo valor ou percentual de juros.
            </DialogDescription>
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
              <Button variant="outline" onClick={() => setJurosOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateJuros}
                disabled={actionLoading || !newJuros}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conceder Abatimento Dialog */}
      <Dialog open={abatimentoOpen} onOpenChange={setAbatimentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Abatimento</DialogTitle>
            <DialogDescription>
              Informe o valor do abatimento a conceder.
            </DialogDescription>
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
              <Button variant="outline" onClick={() => setAbatimentoOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGrantAbatimento}
                disabled={actionLoading || !newAbatimento}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar Abatimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
