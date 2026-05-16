"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  FolderOpen,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Tags,
  X,
  ImageIcon,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import {
  adminListDocuments,
  adminGetPendingDocumentsCount,
  adminReviewDocument,
  getAdminDocumentDownloadUrl,
  updateAdminDocument,
} from "@/services/portal";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_CONFIG,
  DOCUMENT_TYPES_BY_CATEGORY,
  DOCUMENT_CATEGORY_LABELS,
} from "@/types/portal";
import type { ClientDocument, DocumentCategory, DocumentType } from "@/types/portal";
import { PermissionGuard } from "@/components/shared/permission-guard";

const CATEGORY_ORDER: DocumentCategory[] = ["COMPRADOR", "IMOVEL", "OUTROS"];
const ALL_DOC_TYPES: DocumentType[] = CATEGORY_ORDER.flatMap(
  (c) => DOCUMENT_TYPES_BY_CATEGORY[c]
);

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING_REVIEW", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
  { value: "EXPIRED", label: "Expirados" },
];

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function fileIconFor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTENSIONS.includes(ext)) return ImageIcon;
  if (ext === "pdf") return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // Review dialog
  const [reviewDoc, setReviewDoc] = useState<ClientDocument | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Edit tags dialog
  const [editDoc, setEditDoc] = useState<ClientDocument | null>(null);
  const [editType, setEditType] = useState<DocumentType>("OUTROS");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, tagFilter]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const params: { status?: string; document_type?: string; tag?: string } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.document_type = typeFilter;
      if (tagFilter.trim()) params.tag = tagFilter.trim();
      const data = await adminListDocuments(params);
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingCount() {
    try {
      const res = await adminGetPendingDocumentsCount();
      setPendingCount(res.pending_count ?? 0);
    } catch {
      // silent
    }
  }

  function openReview(doc: ClientDocument, action: "APPROVED" | "REJECTED") {
    setReviewDoc(doc);
    setReviewAction(action);
    setRejectionReason("");
  }

  function openEdit(doc: ClientDocument) {
    setEditDoc(doc);
    setEditType(doc.document_type);
    setEditTags([...(doc.tags ?? [])]);
    setEditTagInput("");
  }

  async function handleReview() {
    if (!reviewDoc) return;
    if (reviewAction === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição.");
      return;
    }
    setReviewing(true);
    try {
      const data: { status: "APPROVED" | "REJECTED"; rejection_reason?: string } = {
        status: reviewAction,
      };
      if (reviewAction === "REJECTED") data.rejection_reason = rejectionReason;
      const updated = await adminReviewDocument(reviewDoc.id, data);
      setDocs((prev) =>
        prev.map((d) => (d.id === reviewDoc.id ? { ...d, ...updated } : d))
      );
      toast.success(
        reviewAction === "APPROVED" ? "Documento aprovado" : "Documento rejeitado"
      );
      setReviewDoc(null);
      loadPendingCount();
    } catch {
      toast.error("Erro ao revisar documento.");
    } finally {
      setReviewing(false);
    }
  }

  function handleEditTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = editTagInput.trim();
      if (v && !editTags.includes(v)) setEditTags([...editTags, v]);
      setEditTagInput("");
    }
  }

  async function handleSaveEdit() {
    if (!editDoc) return;
    setEditSaving(true);
    try {
      const updated = await updateAdminDocument(editDoc.id, {
        document_type: editType,
        tags: editTags,
      });
      setDocs((prev) =>
        prev.map((d) => (d.id === editDoc.id ? { ...d, ...updated } : d))
      );
      toast.success("Documento atualizado");
      setEditDoc(null);
    } catch {
      toast.error("Erro ao atualizar documento");
    } finally {
      setEditSaving(false);
    }
  }

  // Group by client_id for the file-manager-like UI
  const docsByClient = useMemo(() => {
    const lowered = searchFilter.trim().toLowerCase();
    const filtered = lowered
      ? docs.filter((d) =>
          (d.file_name + " " + (d.description ?? "")).toLowerCase().includes(lowered)
        )
      : docs;
    const map = new Map<string, ClientDocument[]>();
    filtered.forEach((d) => {
      const list = map.get(d.client_id) ?? [];
      list.push(d);
      map.set(d.client_id, list);
    });
    return Array.from(map.entries());
  }, [docs, searchFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Documentos"
        description="Gerenciador de arquivos por cliente — revise, classifique e baixe."
      />

      {/* Pending count card */}
      {pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-3">
            <FileText className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              {pendingCount} documento{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""} de revisão
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar por nome do arquivo..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as categorias</SelectItem>
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {DOCUMENT_CATEGORY_LABELS[cat]}
                </div>
                {DOCUMENT_TYPES_BY_CATEGORY[cat].map((t) => (
                  <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Input
            placeholder="Filtrar por tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-[180px]"
          />
          {tagFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setTagFilter("")}
              title="Limpar tag"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : docsByClient.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {docsByClient.map(([clientId, clientDocs]) => (
            <Card key={clientId}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">
                    Cliente {clientId.slice(0, 8)}…
                  </p>
                  <Badge variant="secondary" className="ml-auto">
                    {clientDocs.length} arquivo{clientDocs.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {clientDocs.map((doc) => {
                    const statusCfg =
                      DOCUMENT_STATUS_CONFIG[doc.status] ||
                      DOCUMENT_STATUS_CONFIG.PENDING_REVIEW;
                    const isPending = doc.status === "PENDING_REVIEW";
                    const Icon = fileIconFor(doc.file_name);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 rounded-md border px-3 py-2 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{doc.file_name}</p>
                            <Badge variant={statusCfg.variant} className="text-xs">
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {DOCUMENT_TYPE_LABELS[doc.document_type]}
                            </Badge>
                            {(doc.tags ?? []).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-secondary/70"
                                onClick={() => setTagFilter(t)}
                                title={`Filtrar por "${t}"`}
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                          )}
                          {doc.status === "REJECTED" && doc.rejection_reason && (
                            <p className="text-xs text-destructive mt-0.5">
                              Motivo: {doc.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" asChild title="Baixar">
                            <a
                              href={getAdminDocumentDownloadUrl(doc.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <PermissionGuard permission="manage_documents">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(doc)}
                              title="Editar tags"
                            >
                              <Tags className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                          {isPending && (
                            <PermissionGuard permission="manage_documents">
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => openReview(doc, "APPROVED")}
                                  title="Aprovar"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openReview(doc, "REJECTED")}
                                  title="Rejeitar"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            </PermissionGuard>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDoc} onOpenChange={(open) => { if (!open) setReviewDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED" ? "Aprovar Documento" : "Rejeitar Documento"}
            </DialogTitle>
            <DialogDescription>
              {reviewDoc?.file_name} — {reviewDoc && DOCUMENT_TYPE_LABELS[reviewDoc.document_type]}
            </DialogDescription>
          </DialogHeader>
          {reviewAction === "REJECTED" && (
            <div>
              <Label className="text-sm font-medium">Motivo da Rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
          {reviewAction === "APPROVED" && (
            <p className="text-sm text-muted-foreground">
              Confirma a aprovação deste documento?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDoc(null)}>Cancelar</Button>
            <Button
              variant={reviewAction === "APPROVED" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={reviewing}
            >
              {reviewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : reviewAction === "APPROVED" ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {reviewAction === "APPROVED" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit tags / category Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => { if (!open) setEditDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar classificação</DialogTitle>
            <DialogDescription>{editDoc?.file_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoria</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as DocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => setEditTags(editTags.filter((x) => x !== t))}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={handleEditTagKey}
                placeholder="Digite uma tag e pressione Enter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={editSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
