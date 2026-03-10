"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText, FolderOpen, Loader2, CheckCircle, XCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  getDocumentDownloadUrl,
} from "@/services/portal";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_CONFIG,
} from "@/types/portal";
import type { ClientDocument, DocumentType, DocumentStatus } from "@/types/portal";

const DOC_TYPES: DocumentType[] = [
  "RG", "CPF", "COMPROVANTE_RESIDENCIA", "CNH", "CONTRATO", "OUTROS",
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING_REVIEW", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
  { value: "EXPIRED", label: "Expirados" },
];

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Review dialog
  const [reviewDoc, setReviewDoc] = useState<ClientDocument | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadPendingCount();
  }, [statusFilter, typeFilter]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const params: { status?: string; document_type?: string } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.document_type = typeFilter;
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
      setPendingCount(res.count ?? 0);
    } catch {
      // silent
    }
  }

  function openReview(doc: ClientDocument, action: "APPROVED" | "REJECTED") {
    setReviewDoc(doc);
    setReviewAction(action);
    setRejectionReason("");
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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Documentos"
        description="Revise e aprove documentos enviados por clientes"
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

      <div className="flex gap-3">
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const statusCfg = DOCUMENT_STATUS_CONFIG[doc.status] || DOCUMENT_STATUS_CONFIG.PENDING_REVIEW;
            const isPending = doc.status === "PENDING_REVIEW";
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <Badge variant={statusCfg.variant} className="text-xs">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{DOCUMENT_TYPE_LABELS[doc.document_type]}</span>
                        <span>{formatFileSize(doc.file_size)}</span>
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
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={doc.file_url || getDocumentDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    {isPending && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => openReview(doc, "APPROVED")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openReview(doc, "REJECTED")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              <label className="text-sm font-medium">Motivo da Rejeição *</label>
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
    </div>
  );
}
