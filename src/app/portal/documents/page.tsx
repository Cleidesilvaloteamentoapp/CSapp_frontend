"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Upload, FolderOpen, FileText, Loader2, Download, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import {
  listClientDocuments,
  uploadClientDocument,
  deleteClientDocument,
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

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING_REVIEW", label: "Em Análise" },
  { value: "APPROVED", label: "Aprovados" },
  { value: "REJECTED", label: "Rejeitados" },
];

export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocumentType>("OUTROS");
  const [uploadDesc, setUploadDesc] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const params: { document_type?: DocumentType; doc_status?: string } = {};
      if (statusFilter !== "ALL") params.doc_status = statusFilter;
      if (typeFilter !== "ALL") params.document_type = typeFilter as DocumentType;
      const data = await listClientDocuments(params);
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const doc = await uploadClientDocument(
        uploadFile,
        uploadType,
        uploadDesc || undefined
      );
      setDocs((prev) => [doc, ...prev]);
      toast.success("Documento enviado com sucesso");
      resetUploadDialog();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  }

  function resetUploadDialog() {
    setUploadOpen(false);
    setUploadFile(null);
    setUploadType("OUTROS");
    setUploadDesc("");
  }

  async function handleDelete(docId: string) {
    try {
      await deleteClientDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover documento");
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Meus Documentos" description="Envie e acompanhe seus documentos" />
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> Enviar Documento
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {DOCUMENT_TYPE_LABELS[doc.document_type]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </span>
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
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    {doc.status === "PENDING_REVIEW" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) resetUploadDialog(); else setUploadOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>Selecione o tipo e o arquivo para envio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Documento *</label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as DocumentType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Arquivo *</label>
              <Input
                type="file"
                className="mt-1"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 100 * 1024 * 1024) {
                    toast.error(
                      `Arquivo muito grande (${(f.size / 1024 / 1024).toFixed(1)}MB). Máximo: 100MB.`
                    );
                    e.target.value = "";
                    setUploadFile(null);
                    return;
                  }
                  setUploadFile(f);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, imagens, planilhas e documentos (máx 100MB)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Descrição do documento..."
                className="mt-1"
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetUploadDialog}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
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
    </div>
  );
}
