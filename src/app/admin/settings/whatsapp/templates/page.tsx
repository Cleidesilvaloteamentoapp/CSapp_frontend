"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  listWhatsAppTemplates,
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  listWhatsAppCredentials,
} from "@/services/whatsapp";
import type {
  TemplateResponse,
  TemplateCategory,
  WhatsAppCredentialResponse,
} from "@/types/whatsapp";
import { ApiError } from "@/lib/api";

// ===================== Schema =====================

const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .regex(
      /^[a-z0-9_]+$/,
      "Apenas letras minúsculas, números e underscores (ex: alerta_vencimento)"
    ),
  language: z.string().min(1, "Idioma é obrigatório"),
  category: z.enum(["UTILITY", "MARKETING", "AUTHENTICATION"]),
  body_text: z
    .string()
    .min(1, "Texto do template é obrigatório")
    .max(1024, "Texto muito longo (máx. 1024 caracteres)"),
  header_text: z.string().optional(),
  footer_text: z.string().max(60, "Rodapé muito longo (máx. 60 caracteres)").optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const LANGUAGES = [
  { value: "pt_BR", label: "Português (Brasil)" },
  { value: "en_US", label: "Inglês (EUA)" },
  { value: "es_MX", label: "Espanhol (México)" },
  { value: "es_AR", label: "Espanhol (Argentina)" },
];

const CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  {
    value: "UTILITY",
    label: "Utilidade",
    description: "Atualizações de conta, alertas de pagamento, confirmações",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Promoções, ofertas, campanhas de vendas",
  },
  {
    value: "AUTHENTICATION",
    label: "Autenticação",
    description: "Códigos de verificação, confirmação de identidade",
  },
];

// ===================== Status Badge =====================

function TemplateStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Aprovado
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3" />
          Rejeitado
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  return (
    <Badge variant="outline" className="font-normal">
      {cat?.label || category}
    </Badge>
  );
}

// ===================== Empty State =====================

function EmptyState({ onAdd, hasMetaCredential }: { onAdd: () => void; hasMetaCredential: boolean }) {
  if (!hasMetaCredential) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            Credencial Meta não configurada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Para gerenciar templates, você precisa primeiro configurar uma credencial Meta Cloud API
            na página de configurações do WhatsApp.
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/settings/whatsapp">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir para Configurações
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Nenhum template encontrado</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Templates são modelos de mensagem pré-aprovados pela Meta. Crie um template para
          começar a enviar mensagens via WhatsApp Business API.
        </p>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Template
        </Button>
      </CardContent>
    </Card>
  );
}

// ===================== Create Template Dialog =====================

function CreateTemplateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: {
      name: "",
      language: "pt_BR",
      category: undefined,
      body_text: "",
      header_text: "",
      footer_text: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        language: "pt_BR",
        category: undefined,
        body_text: "",
        header_text: "",
        footer_text: "",
      });
    }
  }, [open]);

  async function onSubmit(values: TemplateFormValues) {
    setSaving(true);
    try {
      const components: Array<{ type: string; text?: string }> = [];

      if (values.header_text?.trim()) {
        components.push({ type: "HEADER", text: values.header_text.trim() });
      }

      components.push({ type: "BODY", text: values.body_text });

      if (values.footer_text?.trim()) {
        components.push({ type: "FOOTER", text: values.footer_text.trim() });
      }

      await createWhatsAppTemplate({
        name: values.name,
        language: values.language,
        category: values.category,
        components,
      });

      toast.success(
        "Template criado com sucesso! Aguarde a aprovação da Meta (pode levar até 24h)."
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao criar template";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const bodyText = form.watch("body_text") || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criar Template de Mensagem
          </DialogTitle>
          <DialogDescription>
            Crie um modelo de mensagem para envio via Meta Cloud API. Após criar, o template
            será enviado para aprovação da Meta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Após a criação, o template ficará com status <strong>Pendente</strong> até ser
            aprovado pela Meta (pode levar até 24h).
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do template</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="alerta_vencimento_boleto"
                      onChange={(e) => {
                        const val = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "");
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Apenas letras minúsculas, números e underscores. Não pode ser alterado após a criação.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div>
                              <p>{cat.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {cat.description}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="header_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cabeçalho{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Alerta de Vencimento"
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Texto em destaque que aparece no topo da mensagem
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corpo da mensagem</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder={`Olá {{1}}, seu boleto no valor de R$ {{2}} vence em {{3}}.\n\nAcesse o portal do cliente para mais detalhes.`}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Use {"{{1}}"}, {"{{2}}"}, etc. para variáveis dinâmicas
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      {bodyText.length}/1024
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Rodapé{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Não responda esta mensagem"
                      maxLength={60}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Texto pequeno no final da mensagem (máx. 60 caracteres)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Template"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Template Detail Dialog =====================

function TemplateDetailDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: TemplateResponse | null;
}) {
  if (!template) return null;

  const header = template.components.find((c) => c.type === "HEADER");
  const body = template.components.find((c) => c.type === "BODY");
  const footer = template.components.find((c) => c.type === "FOOTER");
  const langLabel = LANGUAGES.find((l) => l.value === template.language)?.label || template.language;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes do template de mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <TemplateStatusBadge status={template.status} />
            <CategoryBadge category={template.category} />
            <Badge variant="outline" className="font-normal">
              {langLabel}
            </Badge>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Pré-visualização
            </p>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1.5 max-w-[280px]">
              {header?.text && (
                <p className="text-sm font-bold text-foreground">{header.text}</p>
              )}
              {body?.text && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{body.text}</p>
              )}
              {footer?.text && (
                <p className="text-xs text-muted-foreground mt-1">{footer.text}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Main Page =====================

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMetaCredential, setHasMetaCredential] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTemplateName, setDeleteTemplateName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<TemplateResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const creds = await listWhatsAppCredentials();
      const hasMeta = creds.some((c) => c.provider === "META" && c.is_active);
      setHasMetaCredential(hasMeta);

      if (hasMeta) {
        const data = await listWhatsAppTemplates();
        setTemplates(data);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao carregar templates";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteTemplateName) return;
    setDeleting(true);
    try {
      await deleteWhatsAppTemplate(deleteTemplateName);
      toast.success("Template deletado com sucesso");
      setDeleteTemplateName(null);
      await fetchData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao deletar template";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  function handleViewDetail(template: TemplateResponse) {
    setDetailTemplate(template);
    setDetailOpen(true);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates WhatsApp"
        description="Gerencie os modelos de mensagem da Meta Cloud API"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/settings/whatsapp">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar
            </Link>
          </Button>
          {hasMetaCredential && templates.length > 0 && (
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Criar Template
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Sobre templates
              </p>
              <p className="text-sm text-blue-800/80">
                Templates são modelos de mensagem que precisam ser aprovados pela Meta antes de
                poderem ser usados. Após criar um template, ele entra em revisão e pode levar até{" "}
                <strong>24 horas</strong> para ser aprovado. Somente templates com status{" "}
                <strong>Aprovado</strong> podem ser enviados aos clientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!hasMetaCredential || templates.length === 0 ? (
        <EmptyState
          onAdd={() => setCreateDialogOpen(true)}
          hasMetaCredential={hasMetaCredential}
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Templates cadastrados</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? "s" : ""} encontrado
              {templates.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Idioma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => {
                    const langLabel =
                      LANGUAGES.find((l) => l.value === template.language)?.label ||
                      template.language;

                    return (
                      <TableRow key={template.name}>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleViewDetail(template)}
                            className="font-mono text-sm text-primary hover:underline cursor-pointer"
                          >
                            {template.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={template.category} />
                        </TableCell>
                        <TableCell className="text-sm">{langLabel}</TableCell>
                        <TableCell>
                          <TemplateStatusBadge status={template.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            onClick={() => setDeleteTemplateName(template.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSaved={fetchData}
      />

      <TemplateDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        template={detailTemplate}
      />

      <ConfirmationDialog
        open={!!deleteTemplateName}
        onOpenChange={(open) => {
          if (!open) setDeleteTemplateName(null);
        }}
        title="Deletar Template"
        description={`Tem certeza que deseja deletar o template "${deleteTemplateName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Deletar"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
