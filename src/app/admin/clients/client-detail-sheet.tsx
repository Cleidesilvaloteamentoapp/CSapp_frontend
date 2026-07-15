"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Pencil, FileText, Upload, Loader2, Download, ExternalLink,
  ArrowLeftRight, FastForward, RefreshCw, CheckCircle, DollarSign, Plus, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { formatPhone, formatCpfCnpj, formatDate, formatCurrency } from "@/lib/format";
import { useClientBoletos } from "@/hooks/use-client-boletos";
import { downloadBoletoPdf, triggerPdfDownload } from "@/services/sicredi";
import { STATUS_CONFIG } from "@/types/sicredi";
import { TAG_CONFIG, type BoletoTag } from "@/types";
import { WORKFLOW_STATUS_CONFIG } from "@/types";
import type {
  ClientResponse, ClientLotResponse, InvoiceResponse,
  CycleApprovalResponse, ContractTransferResponse, EarlyPayoffResponse,
  CompanyFinancialSettingsResponse, AdjustmentIndex, AdjustmentFrequency,
  ClientLotFinancialRulesUpdate, LotResponse, PaginatedResponse,
  InstallmentInfo,
} from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  type DocumentType,
  type DocumentCategory,
} from "@/types/portal";
import type { ClientDocument } from "@/types/portal";
import {
  getFinancialSettings, getClientLotDetail, updateClientLotFinancialRules,
  getInstallmentInfo, getClientDocuments,
} from "@/services/admin";
import { InstallmentInfoCard } from "@/components/shared/installment-info-card";
import { ConfirmSaleDialog, type RateOverrides } from "@/components/financial/confirm-sale-dialog";
import type { PlanPreviewRequest } from "@/lib/pricing";

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

const INDEX_LABELS: Record<string, string> = {
  IPCA: "IPCA", IGPM: "IGP-M", CUB: "CUB", INPC: "INPC",
};
const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "Mensal", QUARTERLY: "Trimestral", SEMIANNUAL: "Semestral", ANNUAL: "Anual",
};
const HARDCODED: Record<string, number | string> = {
  penalty_rate: 2, daily_interest_rate: 0.033,
  adjustment_index: "IPCA", adjustment_frequency: "ANNUAL", adjustment_custom_rate: 5,
};

export function ClientDetailSheet({ client, onClose, onEdit }: ClientDetailSheetProps) {
  const { isSuperAdmin } = useAuth();
  const [lots, setLots] = useState<ClientLotResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [cycles, setCycles] = useState<CycleApprovalResponse[]>([]);
  const [transfers, setTransfers] = useState<ContractTransferResponse[]>([]);
  const [earlyPayoffs, setEarlyPayoffs] = useState<EarlyPayoffResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Financial rules
  const [companyDefaults, setCompanyDefaults] = useState<CompanyFinancialSettingsResponse | null>(null);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<ClientLotResponse | null>(null);
  const [rulesForm, setRulesForm] = useState<ClientLotFinancialRulesUpdate>({});
  const [savingRules, setSavingRules] = useState(false);

  // Lot assignment
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [availableLots, setAvailableLots] = useState<LotResponse[]>([]);
  const [loadingAvailableLots, setLoadingAvailableLots] = useState(false);
  const [assigningLot, setAssigningLot] = useState(false);
  const [assignFinExpanded, setAssignFinExpanded] = useState(false);
  
  // Installment info for selected lot
  const [selectedLotForInfo, setSelectedLotForInfo] = useState<ClientLotResponse | null>(null);
  const [installmentInfo, setInstallmentInfo] = useState<InstallmentInfo | null>(null);
  const [loadingInstallmentInfo, setLoadingInstallmentInfo] = useState(false);
  // Documents
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Document upload
  const [uploadDocType, setUploadDocType] = useState<DocumentType>("OUTROS");
  const [uploadDocDialogOpen, setUploadDocDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [assignForm, setAssignForm] = useState({
    lot_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    total_value: 0,
    installments: 12 as number | undefined,
    monthly_value: undefined as number | undefined,
    first_due: "",
    down_payment: undefined as number | undefined,
    penalty_rate: undefined as number | undefined,
    daily_interest_rate: undefined as number | undefined,
    adjustment_index: undefined as AdjustmentIndex | undefined,
    adjustment_frequency: undefined as AdjustmentFrequency | undefined,
    adjustment_custom_rate: undefined as number | undefined,
    annual_adjustment_rate: undefined as number | undefined,
  });

  // Confirmation step
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<PlanPreviewRequest | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  
  const { boletos, loading: boletosLoading, error: boletosError } = useClientBoletos(client?.id || null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setDocumentsLoading(true);
    Promise.all([
      api.get<ClientLotResponse[]>(`/admin/clients/${client.id}/lots`).catch(() => []),
      api.get<InvoiceResponse[]>(`/admin/clients/${client.id}/invoices`).catch(() => []),
      api.get<CycleApprovalResponse[]>(`/admin/cycle-approvals?client_id=${client.id}`).catch(() => []),
      api.get<ContractTransferResponse[]>(`/admin/transfers?client_id=${client.id}`).catch(() => []),
      api.get<EarlyPayoffResponse[]>(`/admin/early-payoff-requests?client_id=${client.id}`).catch(() => []),
      getFinancialSettings().catch(() => null),
      getClientDocuments(client.id).catch(() => []),
    ])
      .then(([lotsData, invoicesData, cyclesData, transfersData, payoffData, defaults, docsData]) => {
        const loadedLots = lotsData || [];
        setLots(loadedLots);
        setInvoices(invoicesData);
        setCycles(Array.isArray(cyclesData) ? cyclesData : []);
        setTransfers(Array.isArray(transfersData) ? transfersData : []);
        setEarlyPayoffs(Array.isArray(payoffData) ? payoffData : []);
        setCompanyDefaults(defaults as CompanyFinancialSettingsResponse | null);
        setDocuments(Array.isArray(docsData) ? docsData : []);
        
        // Auto-load installment info for the first lot
        if (loadedLots.length > 0) {
          const firstLot = loadedLots[0];
          setSelectedLotForInfo(firstLot);
          getInstallmentInfo(firstLot.id)
            .then((info) => setInstallmentInfo(info))
            .catch(() => setInstallmentInfo(null));
        }
      })
      .finally(() => {
        setLoading(false);
        setDocumentsLoading(false);
      });
  }, [client]);

  function openFinancialRules(lot: ClientLotResponse) {
    setEditingLot(lot);
    setRulesForm({
      penalty_rate: lot.penalty_rate,
      daily_interest_rate: lot.daily_interest_rate,
      adjustment_index: lot.adjustment_index,
      adjustment_frequency: lot.adjustment_frequency,
      adjustment_custom_rate: lot.adjustment_custom_rate,
      annual_adjustment_rate: lot.annual_adjustment_rate,
    });
    setRulesDialogOpen(true);
  }

  async function loadInstallmentInfoForLot(lot: ClientLotResponse) {
    setSelectedLotForInfo(lot);
    setLoadingInstallmentInfo(true);
    try {
      const info = await getInstallmentInfo(lot.id);
      setInstallmentInfo(info);
    } catch {
      setInstallmentInfo(null);
    } finally {
      setLoadingInstallmentInfo(false);
    }
  }

  async function handleSaveRules() {
    if (!editingLot) return;
    setSavingRules(true);
    try {
      const updated = await updateClientLotFinancialRules(editingLot.id, rulesForm);
      setLots((prev) => prev.map((l) => (l.id === editingLot.id ? updated : l)));
      toast.success("Regras financeiras atualizadas");
      setRulesDialogOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar regras");
      }
    } finally {
      setSavingRules(false);
    }
  }

  function getEffective(lotVal: number | string | null, field: string): { value: string; source: "custom" | "company" | "system" } {
    if (lotVal != null) return { value: String(lotVal), source: "custom" };
    const compVal = companyDefaults ? (companyDefaults as unknown as Record<string, unknown>)[field] : undefined;
    if (compVal != null) return { value: String(compVal), source: "company" };
    return { value: String(HARDCODED[field] ?? "—"), source: "system" };
  }

  function formatRate(val: string): string {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return `${n.toFixed(n < 0.1 ? 3 : 1)}%`;
  }

  async function openAssignDialog() {
    setAssignForm({
      lot_id: "", purchase_date: new Date().toISOString().split("T")[0],
      total_value: 0, installments: 12, monthly_value: undefined, first_due: "",
      down_payment: undefined, penalty_rate: undefined, daily_interest_rate: undefined,
      adjustment_index: undefined, adjustment_frequency: undefined,
      adjustment_custom_rate: undefined, annual_adjustment_rate: undefined,
    });
    setAssignFinExpanded(false);
    setAssignDialogOpen(true);
    setLoadingAvailableLots(true);
    try {
      const res = await api.get<PaginatedResponse<LotResponse>>("/admin/lots/?status=AVAILABLE&per_page=50");
      setAvailableLots(res.items || []);
    } catch {
      toast.error("Erro ao carregar lotes disponíveis");
      setAvailableLots([]);
    } finally {
      setLoadingAvailableLots(false);
    }
  }

  // Validate, then open the confirmation dialog (does NOT submit yet).
  function handleAssignLot() {
    if (!client || !assignForm.lot_id) {
      toast.error("Selecione um lote");
      return;
    }
    if (assignForm.total_value <= 0) {
      toast.error("Valor total deve ser maior que 0");
      return;
    }
    const payload: Record<string, unknown> = {
      client_id: client.id,
      lot_id: assignForm.lot_id,
      purchase_date: assignForm.purchase_date,
      total_value: assignForm.total_value,
      payment_plan: {
        installments: assignForm.installments,
        monthly_value: assignForm.monthly_value,
        first_due: assignForm.first_due || undefined,
        down_payment: assignForm.down_payment,
      },
    };
    if (assignForm.penalty_rate !== undefined) payload.penalty_rate = assignForm.penalty_rate;
    if (assignForm.daily_interest_rate !== undefined) payload.daily_interest_rate = assignForm.daily_interest_rate;
    if (assignForm.adjustment_index !== undefined) payload.adjustment_index = assignForm.adjustment_index;
    if (assignForm.adjustment_frequency !== undefined) payload.adjustment_frequency = assignForm.adjustment_frequency;
    if (assignForm.adjustment_custom_rate !== undefined) payload.adjustment_custom_rate = assignForm.adjustment_custom_rate;
    if (assignForm.annual_adjustment_rate !== undefined) payload.annual_adjustment_rate = assignForm.annual_adjustment_rate;

    setPendingPayload(payload);
    setPreviewRequest({
      total_value: assignForm.total_value,
      down_payment: assignForm.down_payment,
      total_installments: assignForm.installments,
      monthly_value: assignForm.monthly_value,
      purchase_date: assignForm.purchase_date,
      first_due: assignForm.first_due || undefined,
      penalty_rate: assignForm.penalty_rate,
      daily_interest_rate: assignForm.daily_interest_rate,
      adjustment_index: assignForm.adjustment_index,
      adjustment_frequency: assignForm.adjustment_frequency,
      adjustment_custom_rate: assignForm.adjustment_custom_rate,
    });
    setConfirmOpen(true);
  }

  // Admin confirmed — merge rate edits and create the sale.
  async function doAssignLot(overrides: RateOverrides) {
    if (!client || !pendingPayload) return;
    setAssigningLot(true);
    try {
      await api.post("/admin/lots/assign", { ...pendingPayload, ...overrides });
      toast.success("Lote atrelado com sucesso! Faturas geradas automaticamente.");
      setConfirmOpen(false);
      setAssignDialogOpen(false);
      const updatedLots = await api.get<ClientLotResponse[]>(`/admin/clients/${client.id}/lots`).catch(() => []);
      setLots(updatedLots);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao atrelar lote");
      }
    } finally {
      setAssigningLot(false);
    }
  }

  function onSelectLot(lotId: string) {
    const lot = availableLots.find((l) => l.id === lotId);
    setAssignForm((prev) => ({
      ...prev,
      lot_id: lotId,
      total_value: lot ? parseFloat(lot.price) : prev.total_value,
    }));
  }

  function openUploadDialog() {
    setSelectedFile(null);
    setUploadDocType("OUTROS");
    setUploadDocDialogOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleUpload() {
    if (!client || !selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", uploadDocType);
      await api.post(`/admin/clients/${client.id}/documents`, formData);
      toast.success("Documento enviado com sucesso");
      setUploadDocDialogOpen(false);
      setSelectedFile(null);
      setUploadDocType("OUTROS");
      // Refresh documents list
      const updatedDocs = await getClientDocuments(client.id).catch(() => []);
      setDocuments(Array.isArray(updatedDocs) ? updatedDocs : []);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao enviar documento");
      }
    } finally {
      setUploading(false);
    }
  }

  // Document card component
  function DocumentCard({ doc }: { doc: any }) {
    const docType = (doc.document_type || "OUTROS") as DocumentType;
    const typeLabel = DOCUMENT_TYPE_LABELS[docType] || "Documento";
    const fileName = doc.file_name || doc.path || doc.url || "Documento";
    const fileUrl = doc.file_url || doc.url || "#";

    return (
      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <Badge variant="secondary" className="text-[10px] mt-1">{typeLabel}</Badge>
        </div>
        <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
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
    <>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="info">Dados</TabsTrigger>
                <TabsTrigger value="lots">Lotes</TabsTrigger>
                <TabsTrigger value="invoices">Faturas</TabsTrigger>
                <TabsTrigger value="boletos">Boletos</TabsTrigger>
                <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
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
                      value={`${addr.street}, ${addr.number || "S/N"}${addr.neighborhood ? ` - ${addr.neighborhood}` : ""} — ${addr.city || ""}/${addr.state || ""} ${addr.zip || ""}`}
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
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-muted-foreground">Nenhum lote associado a este cliente</p>
                    <Button variant="outline" onClick={openAssignDialog}>
                      <Plus className="mr-2 h-4 w-4" /> Atrelar Lote
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Installment Info Card */}
                    {installmentInfo && selectedLotForInfo && (
                      <InstallmentInfoCard 
                        info={installmentInfo}
                        showActions={false}
                      />
                    )}
                    
                    {/* Summary Stats */}
                    {lots.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-muted p-3 text-center">
                          <p className="text-2xl font-bold">{lots.length}</p>
                          <p className="text-xs text-muted-foreground">Imóveis</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {lots.reduce((sum, l) => sum + (l.total_installments || 0), 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Parcelas</p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {installmentInfo ? installmentInfo.paid_installments : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">Parcelas Pagas</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={openAssignDialog}>
                        <Plus className="mr-2 h-4 w-4" /> Atrelar Lote
                      </Button>
                    </div>
                    {lots.map((lot) => {
                      const penEff = getEffective(lot.penalty_rate, "penalty_rate");
                      const intEff = getEffective(lot.daily_interest_rate, "daily_interest_rate");
                      const idxEff = getEffective(lot.adjustment_index, "adjustment_index");
                      const freqEff = getEffective(lot.adjustment_frequency, "adjustment_frequency");
                      const custEff = getEffective(lot.adjustment_custom_rate, "adjustment_custom_rate");
                      const isSelected = selectedLotForInfo?.id === lot.id;
                      return (
                        <div 
                          key={lot.id} 
                          className={cn(
                            "rounded-lg border p-4 space-y-3 cursor-pointer transition-colors",
                            isSelected ? "border-primary bg-primary/5" : "hover:border-gray-300"
                          )}
                          onClick={() => loadInstallmentInfoForLot(lot)}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-sm">Lote {lot.lot_id.slice(0, 8)}...</p>
                            <div className="flex items-center gap-2">
                              {isSelected && loadingInstallmentInfo && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              <Badge variant="secondary">{lot.status}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <p>Valor: <span className="font-medium text-foreground">{formatCurrency(lot.total_value)}</span></p>
                            <p>Compra: <span className="font-medium text-foreground">{formatDate(lot.purchase_date)}</span></p>
                            {lot.total_installments > 0 && (
                              <p>Parcelas: <span className="font-medium text-foreground">{lot.total_installments}</span></p>
                            )}
                            {lot.current_cycle > 0 && (
                              <p>Ciclo: <span className="font-medium text-foreground">{lot.current_cycle}</span></p>
                            )}
                            {lot.current_installment_value != null && (
                              <p>Parcela atual: <span className="font-medium text-foreground">{formatCurrency(lot.current_installment_value)}</span></p>
                            )}
                            {lot.down_payment != null && lot.down_payment > 0 && (
                              <p>Entrada: <span className="font-medium text-foreground">{formatCurrency(lot.down_payment)}</span></p>
                            )}
                          </div>
                          
                          {/* Progress bar for installments */}
                          {isSelected && installmentInfo && (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progresso: {installmentInfo.paid_installments} de {installmentInfo.total_installments} parcelas</span>
                                <span className="font-medium">
                                  {Math.round((installmentInfo.paid_installments / installmentInfo.total_installments) * 100)}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-green-500 transition-all"
                                  style={{ 
                                    width: `${(installmentInfo.paid_installments / installmentInfo.total_installments) * 100}%` 
                                  }}
                                />
                              </div>
                              {installmentInfo.remaining_installments > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {installmentInfo.remaining_installments} parcelas restantes
                                  {installmentInfo.installments_in_current_cycle >= 12 && (
                                    <span className="ml-2 text-yellow-600 font-medium">⚠ Ciclo completo</span>
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          <Separator />
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Regras Financeiras</p>
                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openFinancialRules(lot)}>
                                <Pencil className="mr-1 h-3 w-3" /> Editar
                              </Button>
                            </div>
                            <FinancialRuleRow label="Multa" value={formatRate(penEff.value)} source={penEff.source} />
                            <FinancialRuleRow label="Juros/dia" value={formatRate(intEff.value)} source={intEff.source} />
                            <FinancialRuleRow label="Índice" value={INDEX_LABELS[idxEff.value] || idxEff.value} source={idxEff.source} />
                            <FinancialRuleRow label="Frequência" value={FREQ_LABELS[freqEff.value] || freqEff.value} source={freqEff.source} />
                            <FinancialRuleRow label="Taxa fixa" value={formatRate(custEff.value)} source={custEff.source} />
                          </div>
                        </div>
                      );
                    })}
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
                      const cfg = STATUS_CONFIG[boleto.status] || STATUS_CONFIG.NORMAL;
                      return (
                        <div key={boleto.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-medium">Nosso Número: {boleto.nosso_numero}</p>
                                {boleto.tag && TAG_CONFIG[boleto.tag as BoletoTag] && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_CONFIG[boleto.tag as BoletoTag].bg} ${TAG_CONFIG[boleto.tag as BoletoTag].color}`}>
                                    {TAG_CONFIG[boleto.tag as BoletoTag].label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Controle: {boleto.seu_numero}
                                {boleto.installment_label && (
                                  <span className="ml-2 font-medium text-blue-600">{boleto.installment_label}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              {boleto.writeoff_type && (
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                  boleto.writeoff_type === "MANUAL_ADMIN"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {boleto.writeoff_type === "MANUAL_ADMIN" ? "Baixa Manual" : "Baixa Automática"}
                                </span>
                              )}
                            </div>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                            >
                              <a href={`/admin/sicredi/boletos/${boleto.nosso_numero}`}>
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Detalhes
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ajustes" className="mt-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
                ) : (
                  <div className="space-y-5">
                    {/* Regras Financeiras por Lote */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Regras Financeiras por Lote</p>
                      </div>
                      {lots.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-6">
                          Nenhum lote associado. As regras financeiras individuais são configuradas por lote.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {lots.map((lot) => {
                            const penEff = getEffective(lot.penalty_rate, "penalty_rate");
                            const intEff = getEffective(lot.daily_interest_rate, "daily_interest_rate");
                            const idxEff = getEffective(lot.adjustment_index, "adjustment_index");
                            const freqEff = getEffective(lot.adjustment_frequency, "adjustment_frequency");
                            const custEff = getEffective(lot.adjustment_custom_rate, "adjustment_custom_rate");
                            return (
                              <div key={lot.id} className="rounded-lg border p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">Lote {lot.lot_id.slice(0, 8)}...</p>
                                    <Badge variant="secondary" className="text-[10px]">{lot.status}</Badge>
                                  </div>
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openFinancialRules(lot)}>
                                    <Pencil className="mr-1 h-3 w-3" /> Editar Regras
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <FinancialRuleRow label="Multa" value={formatRate(penEff.value)} source={penEff.source} />
                                  <FinancialRuleRow label="Juros/dia" value={formatRate(intEff.value)} source={intEff.source} />
                                  <FinancialRuleRow label="Índice" value={INDEX_LABELS[idxEff.value] || idxEff.value} source={idxEff.source} />
                                  <FinancialRuleRow label="Frequência" value={FREQ_LABELS[freqEff.value] || freqEff.value} source={freqEff.source} />
                                  <FinancialRuleRow label="Taxa fixa" value={formatRate(custEff.value)} source={custEff.source} />
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400" /> customizado
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 ml-2" /> padrão empresa
                            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-2" /> sistema
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Ciclos */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Ciclos de Parcelas</p>
                      </div>
                      {cycles.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-6">Nenhum ciclo encontrado</p>
                      ) : (
                        <div className="space-y-2">
                          {cycles.map((cycle) => {
                            const wcfg = WORKFLOW_STATUS_CONFIG[cycle.status] || { label: cycle.status, variant: "secondary" as const };
                            return (
                              <div key={cycle.id} className="rounded-lg border px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    Ciclo {cycle.cycle_number}
                                    {cycle.lot_identifier && <span className="text-muted-foreground ml-1">— {cycle.lot_identifier}</span>}
                                  </p>
                                  <Badge variant={wcfg.variant}>{wcfg.label}</Badge>
                                </div>
                                <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                                  <span>Anterior: {formatCurrency(cycle.previous_installment_value)}</span>
                                  {cycle.new_installment_value && (
                                    <span className="text-green-600 font-medium">Novo: {formatCurrency(cycle.new_installment_value)}</span>
                                  )}
                                  <span>{formatDate(cycle.requested_at)}</span>
                                </div>
                                {cycle.admin_notes && (
                                  <p className="text-xs bg-muted rounded p-1.5 mt-1.5">{cycle.admin_notes}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Transferências */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Transferências</p>
                      </div>
                      {transfers.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-6">Nenhuma transferência encontrada</p>
                      ) : (
                        <div className="space-y-2">
                          {transfers.map((t) => {
                            const tcfg = WORKFLOW_STATUS_CONFIG[t.status] || { label: t.status, variant: "secondary" as const };
                            return (
                              <div key={t.id} className="rounded-lg border px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm">
                                    <span className="font-medium">{t.from_client_name}</span>
                                    <span className="text-muted-foreground mx-1">→</span>
                                    <span className="font-medium">{t.to_client_name}</span>
                                  </p>
                                  <Badge variant={tcfg.variant}>{tcfg.label}</Badge>
                                </div>
                                <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                                  {t.lot_identifier && <span>Lote: {t.lot_identifier}</span>}
                                  {t.transfer_fee != null && <span>Taxa: {formatCurrency(t.transfer_fee)}</span>}
                                  {t.transfer_date && <span>{formatDate(t.transfer_date)}</span>}
                                </div>
                                {t.reason && (
                                  <p className="text-xs bg-muted rounded p-1.5 mt-1.5">{t.reason}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Antecipações */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FastForward className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Antecipações</p>
                      </div>
                      {earlyPayoffs.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-6">Nenhuma solicitação de antecipação</p>
                      ) : (
                        <div className="space-y-2">
                          {earlyPayoffs.map((ep) => {
                            const epcfg = WORKFLOW_STATUS_CONFIG[ep.status] || { label: ep.status, variant: "secondary" as const };
                            return (
                              <div key={ep.id} className="rounded-lg border px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">{formatDate(ep.requested_at)}</span>
                                  <Badge variant={epcfg.variant}>{epcfg.label}</Badge>
                                </div>
                                {ep.client_message && (
                                  <p className="text-xs mt-1.5">
                                    <span className="font-medium">Mensagem:</span> {ep.client_message}
                                  </p>
                                )}
                                {ep.admin_notes && (
                                  <p className="text-xs bg-muted rounded p-1.5 mt-1.5">
                                    <span className="font-medium">Admin:</span> {ep.admin_notes}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="docs" className="mt-4">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={openUploadDialog}
                  >
                    <Upload className="h-4 w-4" /> Enviar Documento
                  </Button>

                  {documentsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Carregando documentos...
                    </p>
                  ) : (() => {
                    // Group documents by category
                    const docsByCategory: Record<DocumentCategory, any[]> = {
                      COMPRADOR: [],
                      IMOVEL: [],
                      OUTROS: [],
                    };

                    (documents || []).forEach((doc: any) => {
                      const docType = (doc.document_type || "OUTROS") as DocumentType;
                      const category = DOCUMENT_TYPE_CATEGORIES[docType] || "OUTROS";
                      docsByCategory[category].push(doc);
                    });

                    const hasDocuments = Object.values(docsByCategory).some(arr => arr.length > 0);

                    if (!hasDocuments) {
                      return (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum documento enviado
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Documentos do Comprador */}
                        {docsByCategory.COMPRADOR.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              {DOCUMENT_CATEGORY_LABELS.COMPRADOR}
                            </h4>
                            <div className="space-y-2">
                              {docsByCategory.COMPRADOR.map((doc: any, i: number) => (
                                <DocumentCard key={doc.id || i} doc={doc} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documentos do Imóvel */}
                        {docsByCategory.IMOVEL.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              {DOCUMENT_CATEGORY_LABELS.IMOVEL}
                            </h4>
                            <div className="space-y-2">
                              {docsByCategory.IMOVEL.map((doc: any, i: number) => (
                                <DocumentCard key={doc.id || i} doc={doc} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outros Documentos */}
                        {docsByCategory.OUTROS.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              {DOCUMENT_CATEGORY_LABELS.OUTROS}
                            </h4>
                            <div className="space-y-2">
                              {docsByCategory.OUTROS.map((doc: any, i: number) => (
                                <DocumentCard key={doc.id || i} doc={doc} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>

    {/* Financial Rules Edit Dialog */}
    <Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Regras Financeiras do Lote</DialogTitle>
          <DialogDescription>
            Sobrescreva os valores padrão da empresa para este lote. Deixe vazio para usar o padrão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FinancialRuleField
            label="Multa por Atraso (%)"
            value={rulesForm.penalty_rate}
            onChange={(v) => setRulesForm((p) => ({ ...p, penalty_rate: v }))}
            onClear={() => setRulesForm((p) => ({ ...p, penalty_rate: null }))}
            step="0.1"
            suffix="%"
          />
          <FinancialRuleField
            label="Juros Diários (%/dia)"
            value={rulesForm.daily_interest_rate}
            onChange={(v) => setRulesForm((p) => ({ ...p, daily_interest_rate: v }))}
            onClear={() => setRulesForm((p) => ({ ...p, daily_interest_rate: null }))}
            step="0.001"
            suffix="%/dia"
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Índice de Reajuste</label>
              {rulesForm.adjustment_index != null && (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" onClick={() => setRulesForm((p) => ({ ...p, adjustment_index: null }))}>
                  Limpar
                </Button>
              )}
            </div>
            <Select
              value={rulesForm.adjustment_index ?? "__default__"}
              onValueChange={(v) => setRulesForm((p) => ({ ...p, adjustment_index: v === "__default__" ? null : v as AdjustmentIndex }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Padrão da empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Padrão da empresa</SelectItem>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGPM">IGP-M</SelectItem>
                <SelectItem value="CUB">CUB</SelectItem>
                <SelectItem value="INPC">INPC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Frequência de Reajuste</label>
              {rulesForm.adjustment_frequency != null && (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" onClick={() => setRulesForm((p) => ({ ...p, adjustment_frequency: null }))}>
                  Limpar
                </Button>
              )}
            </div>
            <Select
              value={rulesForm.adjustment_frequency ?? "__default__"}
              onValueChange={(v) => setRulesForm((p) => ({ ...p, adjustment_frequency: v === "__default__" ? null : v as AdjustmentFrequency }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Padrão da empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Padrão da empresa</SelectItem>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                <SelectItem value="ANNUAL">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FinancialRuleField
            label="Taxa Fixa Adicional (%)"
            value={rulesForm.adjustment_custom_rate}
            onChange={(v) => setRulesForm((p) => ({ ...p, adjustment_custom_rate: v }))}
            onClear={() => setRulesForm((p) => ({ ...p, adjustment_custom_rate: null }))}
            step="0.1"
            suffix="%"
          />
          <FinancialRuleField
            label="Taxa Reajuste Anual (%)"
            value={rulesForm.annual_adjustment_rate}
            onChange={(v) => setRulesForm((p) => ({ ...p, annual_adjustment_rate: v }))}
            onClear={() => setRulesForm((p) => ({ ...p, annual_adjustment_rate: null }))}
            step="0.1"
            suffix="%"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRulesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRules} disabled={savingRules}>
              {savingRules ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar Regras"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Lot Assignment Dialog */}
    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atrelar Lote ao Cliente</DialogTitle>
          <DialogDescription>
            Selecione um lote disponível e defina as condições de venda para {client?.full_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Lot selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lote *</label>
            {loadingAvailableLots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando lotes disponíveis...
              </div>
            ) : availableLots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum lote disponível. Crie lotes primeiro na página de Lotes.</p>
            ) : (
              <Select value={assignForm.lot_id || "__none__"} onValueChange={(v) => v !== "__none__" && onSelectLot(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Selecione um lote</SelectItem>
                  {availableLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number}{lot.block ? ` / Quadra ${lot.block}` : ""} — {lot.area_m2}m² — {formatCurrency(lot.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Purchase details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Valor Total (R$) *</label>
              <CurrencyInput
                value={assignForm.total_value || undefined}
                onChange={(v) => setAssignForm((p) => ({ ...p, total_value: v ?? 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data da Compra *</label>
              <Input
                type="date"
                value={assignForm.purchase_date}
                onChange={(e) => setAssignForm((p) => ({ ...p, purchase_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment plan */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plano de Pagamento</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Parcelas</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Automático se informar valor mensal"
                  value={assignForm.installments ?? ""}
                  onChange={(e) => setAssignForm((p) => ({ ...p, installments: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Valor Mensal (R$)</label>
                <CurrencyInput
                  placeholder="Automático"
                  value={assignForm.monthly_value}
                  onChange={(v) => setAssignForm((p) => ({ ...p, monthly_value: v }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Primeiro Vencimento</label>
              <Input
                type="date"
                value={assignForm.first_due}
                onChange={(e) => setAssignForm((p) => ({ ...p, first_due: e.target.value }))}
              />
            </div>
          </div>

          {/* Expandable Financial Rules */}
          <div className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setAssignFinExpanded(!assignFinExpanded)}
            >
              <span>{assignFinExpanded ? "Regras Financeiras" : "Usando regras padrão da empresa"}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", assignFinExpanded && "rotate-180")} />
            </button>
            {assignFinExpanded && (
              <div className="border-t px-4 pb-4 pt-3 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar os padrões da empresa. Preencha apenas os campos que deseja sobrescrever.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Entrada (R$)</label>
                    <CurrencyInput
                      placeholder="Sem entrada"
                      value={assignForm.down_payment}
                      onChange={(v) => setAssignForm((p) => ({ ...p, down_payment: v }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Reajuste Anual (%)</label>
                    <Input
                      type="number" step="0.1" placeholder="5"
                      value={assignForm.annual_adjustment_rate ?? ""}
                      onChange={(e) => setAssignForm((p) => ({ ...p, annual_adjustment_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Multa (%)</label>
                    <Input
                      type="number" step="0.1"
                      placeholder={companyDefaults ? String(companyDefaults.penalty_rate) : "2"}
                      value={assignForm.penalty_rate ?? ""}
                      onChange={(e) => setAssignForm((p) => ({ ...p, penalty_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Juros/dia (%/dia)</label>
                    <Input
                      type="number" step="0.001"
                      placeholder={companyDefaults ? String(companyDefaults.daily_interest_rate) : "0.033"}
                      value={assignForm.daily_interest_rate ?? ""}
                      onChange={(e) => setAssignForm((p) => ({ ...p, daily_interest_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Índice de Reajuste</label>
                    <Select
                      value={assignForm.adjustment_index ?? "__default__"}
                      onValueChange={(v) => setAssignForm((p) => ({ ...p, adjustment_index: v === "__default__" ? undefined : v as AdjustmentIndex }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Padrão" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Padrão ({companyDefaults?.adjustment_index ?? "IPCA"})</SelectItem>
                        <SelectItem value="IPCA">IPCA</SelectItem>
                        <SelectItem value="IGPM">IGP-M</SelectItem>
                        <SelectItem value="CUB">CUB</SelectItem>
                        <SelectItem value="INPC">INPC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Frequência</label>
                    <Select
                      value={assignForm.adjustment_frequency ?? "__default__"}
                      onValueChange={(v) => setAssignForm((p) => ({ ...p, adjustment_frequency: v === "__default__" ? undefined : v as AdjustmentFrequency }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Padrão" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Padrão ({companyDefaults?.adjustment_frequency ?? "ANNUAL"})</SelectItem>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                        <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                        <SelectItem value="ANNUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Taxa Fixa Adicional (%)</label>
                  <Input
                    type="number" step="0.1"
                    placeholder={companyDefaults ? String(companyDefaults.adjustment_custom_rate) : "5"}
                    value={assignForm.adjustment_custom_rate ?? ""}
                    onChange={(e) => setAssignForm((p) => ({ ...p, adjustment_custom_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssignLot} disabled={assigningLot || !assignForm.lot_id}>
              <Plus className="mr-2 h-4 w-4" />Revisar e confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmSaleDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      request={previewRequest}
      submitting={assigningLot}
      onConfirm={doAssignLot}
    />

    {/* Document Upload Dialog */}
    <Dialog open={uploadDocDialogOpen} onOpenChange={setUploadDocDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
          <DialogDescription>Selecione o tipo de documento e o arquivo para envio</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de Documento *</label>
            <Select value={uploadDocType} onValueChange={(v) => setUploadDocType(v as DocumentType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OUTROS" disabled className="font-semibold text-muted-foreground">
                  Selecione um tipo...
                </SelectItem>
                {/* Documentos do Comprador */}
                <SelectItem value="__comprador__" disabled className="font-semibold text-muted-foreground bg-muted">
                  Documentos do Comprador
                </SelectItem>
                {DOCUMENT_TYPES_BY_CATEGORY.COMPRADOR.map((t) => (
                  <SelectItem key={t} value={t} className="pl-6">{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
                {/* Documentos do Imóvel */}
                <SelectItem value="__imovel__" disabled className="font-semibold text-muted-foreground bg-muted">
                  Documentos do Imóvel
                </SelectItem>
                {DOCUMENT_TYPES_BY_CATEGORY.IMOVEL.map((t) => (
                  <SelectItem key={t} value={t} className="pl-6">{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
                {/* Outros */}
                <SelectItem value="__outros__" disabled className="font-semibold text-muted-foreground bg-muted">
                  Outros
                </SelectItem>
                {DOCUMENT_TYPES_BY_CATEGORY.OUTROS.map((t) => (
                  <SelectItem key={t} value={t} className="pl-6">{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Arquivo *</label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG (máx 10MB)</p>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setUploadDocDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
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

function FinancialRuleRow({ label, value, source }: { label: string; value: string; source: "custom" | "company" | "system" }) {
  const badgeMap = {
    custom: { label: "customizado", className: "bg-green-100 text-green-700" },
    company: { label: "padrão", className: "bg-blue-100 text-blue-700" },
    system: { label: "sistema", className: "bg-gray-100 text-gray-500" },
  };
  const badge = badgeMap[source];
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono font-medium">{value}</span>
        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
}

function FinancialRuleField({ label, value, onChange, onClear, step, suffix }: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number) => void;
  onClear: () => void;
  step: string;
  suffix: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {value != null && (
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClear}
          >
            Limpar
          </button>
        )}
      </div>
      <div className="relative">
        <Input
          type="number"
          step={step}
          min="0"
          value={value ?? ""}
          placeholder="Padrão da empresa"
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") { onClear(); return; }
            onChange(parseFloat(v));
          }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
