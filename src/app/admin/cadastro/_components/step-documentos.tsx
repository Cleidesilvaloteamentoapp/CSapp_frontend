"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileUp,
  CheckCircle2,
  Upload,
  Loader2,
  AlertTriangle,
  User,
  Home,
  FileQuestion,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { getDocumentDownloadUrl } from "@/services/portal";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  DOCUMENT_CATEGORY_LABELS,
} from "@/types/portal";
import type { DocumentType, ClientDocument, DocumentCategory } from "@/types/portal";
import { HelpHint } from "./help-hint";

interface StepDocumentosProps {
  clientId: string;
  initialDocuments?: ClientDocument[];
  onAddDocument: (doc: ClientDocument) => void;
  onComplete: () => void;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  COMPRADOR: <User className="h-4 w-4" />,
  IMOVEL: <Home className="h-4 w-4" />,
  OUTROS: <FileQuestion className="h-4 w-4" />,
};

const CATEGORY_ORDER: DocumentCategory[] = ["COMPRADOR", "IMOVEL", "OUTROS"];

export function StepDocumentos({
  clientId,
  initialDocuments = [],
  onAddDocument,
  onComplete,
  onBack,
}: StepDocumentosProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>("OUTROS");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!selectedFile || !clientId) {
      toast.error("Selecione um arquivo");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedType);
      const doc = await api.post<ClientDocument>(`/admin/clients/${clientId}/documents`, formData);
      toast.success("Documento enviado com sucesso");
      setDocuments((prev) => [...prev, doc]);
      onAddDocument(doc);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao enviar documento");
      } else {
        toast.error("Erro ao enviar documento");
      }
    } finally {
      setUploading(false);
    }
  }

  const docsByCategory: Record<DocumentCategory, ClientDocument[]> = {
    COMPRADOR: [],
    IMOVEL: [],
    OUTROS: [],
  };

  documents.forEach((doc) => {
    const cat = (() => {
      for (const c of CATEGORY_ORDER) {
        if (DOCUMENT_TYPES_BY_CATEGORY[c].includes(doc.document_type)) return c;
      }
      return "OUTROS";
    })();
    docsByCategory[cat].push(doc);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enviar Documento</CardTitle>
          <CardDescription>
            Envie os documentos do cliente e do imóvel. Você pode pular esta etapa e enviar depois.
            <HelpHint text="Documentos bem organizados facilitam auditorias e processos judiciais. Os tipos ajudam na busca futura." />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Arquivo</label>
              <Input
                ref={inputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{selectedFile.name}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
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
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setSelectedType("OUTROS");
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={uploading}
            >
              Limpar
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="mr-2 h-4 w-4" />Enviar</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p className="text-xs text-yellow-800">
            Nenhum documento enviado ainda. Você pode finalizar o cadastro e enviar documentos posteriormente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const docs = docsByCategory[cat];
            if (docs.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {CATEGORY_ICONS[cat]}
                    {DOCUMENT_CATEGORY_LABELS[cat]}
                    <span className="ml-auto text-xs text-muted-foreground">{docs.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        <span className="truncate">{doc.file_name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {DOCUMENT_TYPE_LABELS[doc.document_type]}
                        </span>
                      </div>
                      <a
                        href={getDocumentDownloadUrl(doc.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        <Button onClick={onComplete}>
          <FileUp className="mr-2 h-4 w-4" /> Finalizar Cadastro
        </Button>
      </div>
    </div>
  );
}
