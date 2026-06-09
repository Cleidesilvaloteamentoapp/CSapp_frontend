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
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Star,
  Trash2,
  Pencil,
  RefreshCw,
  Send,
  MessageSquare,
  Phone,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  CircleDashed,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { NotificationSettingsTab } from "./notification-settings-tab";
import {
  listWhatsAppCredentials,
  createWhatsAppCredential,
  updateWhatsAppCredential,
  deleteWhatsAppCredential,
  setDefaultWhatsAppCredential,
  checkWhatsAppConnectionStatus,
  sendWhatsAppTestMessage,
} from "@/services/whatsapp";
import type {
  WhatsAppCredentialResponse,
  WhatsAppProvider,
  ConnectionStatusResponse,
} from "@/types/whatsapp";
import { ApiError } from "@/lib/api";

// ===================== Schemas =====================

const uazapiSchema = z.object({
  provider: z.literal("UAZAPI"),
  uazapi_base_url: z
    .string()
    .min(1, "URL Base é obrigatória")
    .url("Insira uma URL válida (ex: https://api.uazapi.com)"),
  uazapi_instance_token: z.string().min(1, "Token da instância é obrigatório"),
  is_default: z.boolean().optional(),
});

const metaSchema = z.object({
  provider: z.literal("META"),
  meta_waba_id: z.string().min(1, "WABA ID é obrigatório"),
  meta_phone_number_id: z.string().min(1, "Phone Number ID é obrigatório"),
  meta_access_token: z.string().min(1, "Access Token é obrigatório"),
  is_default: z.boolean().optional(),
});

const testMessageSchema = z.object({
  to: z
    .string()
    .min(12, "Número deve ter pelo menos 12 dígitos")
    .max(15, "Número muito longo")
    .regex(/^\d+$/, "Apenas números (ex: 5511999999999)"),
  body: z
    .string()
    .min(1, "Mensagem é obrigatória")
    .max(4096, "Mensagem muito longa (máx. 4096 caracteres)"),
});

type UazapiFormValues = z.infer<typeof uazapiSchema>;
type MetaFormValues = z.infer<typeof metaSchema>;
type TestMessageFormValues = z.infer<typeof testMessageSchema>;

// ===================== Status Helpers =====================

function getStatusConfig(status?: string) {
  switch (status) {
    case "connected":
      return {
        label: "Conectado",
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700",
        icon: CheckCircle2,
      };
    case "disconnected":
      return {
        label: "Desconectado",
        variant: "destructive" as const,
        className: "",
        icon: XCircle,
      };
    case "connecting":
      return {
        label: "Conectando...",
        variant: "secondary" as const,
        className: "",
        icon: CircleDashed,
      };
    case "error":
      return {
        label: "Erro",
        variant: "destructive" as const,
        className: "",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Desconhecido",
        variant: "secondary" as const,
        className: "",
        icon: CircleDashed,
      };
  }
}

function getProviderLabel(provider: WhatsAppProvider) {
  return provider === "UAZAPI" ? "UAZAPI" : "Meta Cloud API";
}

function getProviderDescription(provider: WhatsAppProvider) {
  return provider === "UAZAPI"
    ? "Envio de mensagens de texto livre"
    : "Envio via templates aprovados pela Meta";
}

// ===================== Credential Card =====================

function CredentialCard({
  credential,
  onCheckStatus,
  onSetDefault,
  onEdit,
  onDeactivate,
  onTestMessage,
}: {
  credential: WhatsAppCredentialResponse;
  onCheckStatus: (id: string) => void;
  onSetDefault: (id: string) => void;
  onEdit: (credential: WhatsAppCredentialResponse) => void;
  onDeactivate: (id: string) => void;
  onTestMessage: (credential: WhatsAppCredentialResponse) => void;
}) {
  const statusConfig = getStatusConfig(credential.connection_status);
  const StatusIcon = statusConfig.icon;
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    await onCheckStatus(credential.id);
    setCheckingStatus(false);
  };

  return (
    <Card className="relative overflow-hidden">
      {credential.is_default && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                credential.provider === "UAZAPI"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {getProviderLabel(credential.provider)}
                {credential.is_default && (
                  <Badge className="bg-green-600 hover:bg-green-700 text-[10px]">
                    <Star className="h-3 w-3 mr-0.5" />
                    Padrão
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {getProviderDescription(credential.provider)}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider-specific info */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
          {credential.provider === "UAZAPI" ? (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">URL Base:</span>
              <span className="font-medium truncate">
                {credential.uazapi_base_url || "—"}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">WABA ID:</span>
                <span className="font-mono text-xs font-medium">
                  {credential.meta_waba_id || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Phone Number ID:</span>
                <span className="font-mono text-xs font-medium">
                  {credential.meta_phone_number_id || "—"}
                </span>
              </div>
            </>
          )}
          {credential.last_status_check && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
              <RefreshCw className="h-3 w-3" />
              Última verificação:{" "}
              {new Date(credential.last_status_check).toLocaleString("pt-BR")}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Wifi className="h-3.5 w-3.5 mr-1.5" />
            )}
            Verificar Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTestMessage(credential)}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Enviar Teste
          </Button>
          {!credential.is_default && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(credential.id)}
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Definir como Padrão
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(credential)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDeactivate(credential.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Desativar
          </Button>
        </div>

        {/* Meta templates link */}
        {credential.provider === "META" && credential.is_active && (
          <div className="pt-2 border-t">
            <Link
              href="/admin/settings/whatsapp/templates"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Gerenciar Templates
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Empty State =====================

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">
          Nenhum provedor configurado
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Configure um provedor de WhatsApp para enviar notificações automáticas
          aos seus clientes, como alertas de vencimento de boletos e atualizações de contratos.
        </p>
        <PermissionGuard permission="manage_whatsapp">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Provedor
          </Button>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}

// ===================== Add/Edit Dialog =====================

function CredentialDialog({
  open,
  onOpenChange,
  editing,
  existingProviders,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: WhatsAppCredentialResponse | null;
  existingProviders: WhatsAppProvider[];
  onSaved: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider | null>(
    editing?.provider ?? null
  );
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const uazapiForm = useForm<UazapiFormValues>({
    resolver: zodResolver(uazapiSchema) as any,
    defaultValues: {
      provider: "UAZAPI",
      uazapi_base_url: "",
      uazapi_instance_token: "",
      is_default: false,
    },
  });

  const metaForm = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema) as any,
    defaultValues: {
      provider: "META",
      meta_waba_id: "",
      meta_phone_number_id: "",
      meta_access_token: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (editing) {
      setSelectedProvider(editing.provider);
      if (editing.provider === "UAZAPI") {
        uazapiForm.reset({
          provider: "UAZAPI",
          uazapi_base_url: editing.uazapi_base_url || "",
          uazapi_instance_token: "",
          is_default: editing.is_default,
        });
      } else {
        metaForm.reset({
          provider: "META",
          meta_waba_id: editing.meta_waba_id || "",
          meta_phone_number_id: editing.meta_phone_number_id || "",
          meta_access_token: "",
          is_default: editing.is_default,
        });
      }
    } else {
      setSelectedProvider(null);
      uazapiForm.reset({
        provider: "UAZAPI",
        uazapi_base_url: "",
        uazapi_instance_token: "",
        is_default: false,
      });
      metaForm.reset({
        provider: "META",
        meta_waba_id: "",
        meta_phone_number_id: "",
        meta_access_token: "",
        is_default: false,
      });
    }
    setShowToken(false);
  }, [editing, open]);

  const canSelectUazapi = !existingProviders.includes("UAZAPI") || editing?.provider === "UAZAPI";
  const canSelectMeta = !existingProviders.includes("META") || editing?.provider === "META";

  async function handleSubmitUazapi(values: UazapiFormValues) {
    setSaving(true);
    try {
      if (editing) {
        await updateWhatsAppCredential(editing.id, {
          uazapi_base_url: values.uazapi_base_url,
          uazapi_instance_token: values.uazapi_instance_token || undefined,
          is_default: values.is_default,
        });
        toast.success("Credencial UAZAPI atualizada com sucesso");
      } else {
        await createWhatsAppCredential(values);
        toast.success("Credencial UAZAPI criada com sucesso");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao salvar credencial";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitMeta(values: MetaFormValues) {
    setSaving(true);
    try {
      if (editing) {
        await updateWhatsAppCredential(editing.id, {
          meta_waba_id: values.meta_waba_id,
          meta_phone_number_id: values.meta_phone_number_id,
          meta_access_token: values.meta_access_token || undefined,
          is_default: values.is_default,
        });
        toast.success("Credencial Meta atualizada com sucesso");
      } else {
        await createWhatsAppCredential(values);
        toast.success("Credencial Meta criada com sucesso");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao salvar credencial";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar Provedor" : "Adicionar Provedor WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize as credenciais do provedor. Campos de token/senha são sempre obrigatórios por segurança."
              : "Escolha o provedor e preencha as credenciais para habilitar o envio de mensagens WhatsApp."}
          </DialogDescription>
        </DialogHeader>

        {/* Provider Selection (only when creating) */}
        {!editing && !selectedProvider && (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">Escolha o tipo de provedor:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!canSelectUazapi}
                onClick={() => setSelectedProvider("UAZAPI")}
                className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">UAZAPI</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Texto livre, sem necessidade de aprovação de templates
                  </p>
                </div>
                {!canSelectUazapi && (
                  <p className="text-[10px] text-destructive">Já configurado</p>
                )}
              </button>
              <button
                type="button"
                disabled={!canSelectMeta}
                onClick={() => setSelectedProvider("META")}
                className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Meta Cloud API</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    API oficial do WhatsApp, requer templates aprovados
                  </p>
                </div>
                {!canSelectMeta && (
                  <p className="text-[10px] text-destructive">Já configurado</p>
                )}
              </button>
            </div>
          </div>
        )}

        {/* UAZAPI Form */}
        {selectedProvider === "UAZAPI" && (
          <Form {...uazapiForm}>
            <form
              onSubmit={uazapiForm.handleSubmit(handleSubmitUazapi)}
              className="space-y-4"
            >
              {!editing && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Você encontra essas informações no painel da sua instância UAZAPI.
                  </span>
                </div>
              )}

              <FormField
                control={uazapiForm.control}
                name="uazapi_base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Base da Instância</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://api.uazapi.com"
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Endereço do servidor da sua instância UAZAPI
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={uazapiForm.control}
                name="uazapi_instance_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token da Instância</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showToken ? "text" : "password"}
                          placeholder={editing ? "Digite o novo token" : "Token de autenticação"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Esse token nunca será exibido novamente após salvar
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={uazapiForm.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Definir como padrão
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Usar este provedor para envio de notificações automáticas
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!editing) {
                      setSelectedProvider(null);
                    } else {
                      onOpenChange(false);
                    }
                  }}
                >
                  {!editing && selectedProvider ? "Voltar" : "Cancelar"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editing ? (
                    "Atualizar Credencial"
                  ) : (
                    "Salvar Credencial"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Meta Form */}
        {selectedProvider === "META" && (
          <Form {...metaForm}>
            <form
              onSubmit={metaForm.handleSubmit(handleSubmitMeta)}
              className="space-y-4"
            >
              {!editing && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Você encontra essas informações no{" "}
                    <a
                      href="https://business.facebook.com/settings/whatsapp-business-accounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Meta Business Suite
                    </a>.
                  </span>
                </div>
              )}

              <FormField
                control={metaForm.control}
                name="meta_waba_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WABA ID (WhatsApp Business Account)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 123456789012345" />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      ID da sua conta WhatsApp Business no Meta
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metaForm.control}
                name="meta_phone_number_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 123456789012345" />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      ID do número de telefone vinculado à conta
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metaForm.control}
                name="meta_access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token (System User)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showToken ? "text" : "password"}
                          placeholder={
                            editing ? "Digite o novo token" : "Token permanente do System User"
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Esse token nunca será exibido novamente após salvar
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metaForm.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Definir como padrão
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Usar este provedor para envio de notificações automáticas
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!editing) {
                      setSelectedProvider(null);
                    } else {
                      onOpenChange(false);
                    }
                  }}
                >
                  {!editing && selectedProvider ? "Voltar" : "Cancelar"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editing ? (
                    "Atualizar Credencial"
                  ) : (
                    "Salvar Credencial"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===================== Test Message Dialog =====================

function TestMessageDialog({
  open,
  onOpenChange,
  credential,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  credential: WhatsAppCredentialResponse | null;
}) {
  const [sending, setSending] = useState(false);
  const form = useForm<TestMessageFormValues>({
    resolver: zodResolver(testMessageSchema) as any,
    defaultValues: { to: "", body: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ to: "", body: "" });
    }
  }, [open]);

  async function onSubmit(values: TestMessageFormValues) {
    setSending(true);
    try {
      await sendWhatsAppTestMessage({
        ...values,
        credential_id: credential?.id,
      });
      toast.success("Mensagem de teste enviada com sucesso!");
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Erro ao enviar mensagem de teste";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Mensagem de Teste
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem de teste para verificar se o provedor{" "}
            {credential ? getProviderLabel(credential.provider) : ""} está funcionando
            corretamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do destinatário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9"
                        placeholder="5511999999999"
                      />
                    </div>
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Formato internacional, sem +, espaços ou traços
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Olá! Esta é uma mensagem de teste do sistema."
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-[11px] text-muted-foreground">
                      {field.value?.length || 0}/4096
                    </span>
                  </div>
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
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Teste
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Status Result Dialog =====================

function StatusResultDialog({
  open,
  onOpenChange,
  result,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: ConnectionStatusResponse | null;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Status da Conexão</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando conexão...</p>
          </div>
        ) : result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center">
              {result.connected ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="font-semibold text-green-700">Conectado</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-7 w-7 text-red-600" />
                  </div>
                  <p className="font-semibold text-red-700">Desconectado</p>
                </div>
              )}
            </div>
            {(result.profile_name || result.phone_number) && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                {result.profile_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Perfil:</span>
                    <span className="font-medium">{result.profile_name}</span>
                  </div>
                )}
                {result.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">{result.phone_number}</span>
                  </div>
                )}
              </div>
            )}
            {result.error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium mb-0.5">Erro:</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        ) : null}
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

export default function WhatsAppSettingsPage() {
  const [credentials, setCredentials] = useState<WhatsAppCredentialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<WhatsAppCredentialResponse | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [testMessageCredential, setTestMessageCredential] =
    useState<WhatsAppCredentialResponse | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusResult, setStatusResult] = useState<ConnectionStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchCredentials = useCallback(async () => {
    try {
      const data = await listWhatsAppCredentials();
      setCredentials(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao carregar credenciais";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  async function handleCheckStatus(id: string) {
    setStatusResult(null);
    setStatusLoading(true);
    setStatusDialogOpen(true);
    try {
      const result = await checkWhatsAppConnectionStatus(id);
      setStatusResult(result);
      await fetchCredentials();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao verificar status";
      toast.error(msg);
      setStatusDialogOpen(false);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultWhatsAppCredential(id);
      toast.success("Provedor definido como padrão");
      await fetchCredentials();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao definir como padrão";
      toast.error(msg);
    }
  }

  async function handleDeactivate() {
    if (!deactivateId) return;
    setDeactivating(true);
    try {
      await deleteWhatsAppCredential(deactivateId);
      toast.success("Provedor desativado com sucesso");
      setDeactivateId(null);
      await fetchCredentials();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao desativar provedor";
      toast.error(msg);
    } finally {
      setDeactivating(false);
    }
  }

  function handleEdit(credential: WhatsAppCredentialResponse) {
    setEditingCredential(credential);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingCredential(null);
    setDialogOpen(true);
  }

  function handleTestMessage(credential: WhatsAppCredentialResponse) {
    setTestMessageCredential(credential);
    setTestDialogOpen(true);
  }

  if (loading) return <PageSkeleton />;

  const existingProviders = credentials.map((c) => c.provider);
  const hasMetaCredential = credentials.some(
    (c) => c.provider === "META" && c.is_active
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações WhatsApp"
        description="Gerencie os provedores e as preferências de notificação via WhatsApp"
      >
        {credentials.length > 0 &&
          existingProviders.length < 2 && (
            <PermissionGuard permission="manage_whatsapp">
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Provedor
              </Button>
            </PermissionGuard>
          )}
      </PageHeader>

      <Tabs defaultValue="provedores" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="provedores">Provedores</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        {/* ---- Tab: Provedores ---- */}
        <TabsContent value="provedores" className="space-y-6 mt-0">
          {/* How it works */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Como funciona?
                  </p>
                  <p className="text-sm text-blue-800/80">
                    O sistema envia alertas automáticos pelo WhatsApp (como vencimentos de boletos).
                    Você pode configurar até <strong>2 provedores</strong> (um UAZAPI e um Meta Cloud API) e definir qual será o <strong>padrão</strong> para envio.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-blue-700">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <strong>UAZAPI</strong> — Mensagens de texto livre
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      <strong>Meta Cloud API</strong> — Templates aprovados pela Meta
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials List */}
          {credentials.length === 0 ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onCheckStatus={handleCheckStatus}
                  onSetDefault={handleSetDefault}
                  onEdit={handleEdit}
                  onDeactivate={(id) => setDeactivateId(id)}
                  onTestMessage={handleTestMessage}
                />
              ))}
            </div>
          )}

          {/* Templates shortcut */}
          {hasMetaCredential && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Templates WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Gerencie os templates de mensagem da Meta Cloud API
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/settings/whatsapp/templates">
                      Gerenciar Templates
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---- Tab: Notificações ---- */}
        <TabsContent value="notificacoes" className="mt-0">
          <NotificationSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CredentialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingCredential}
        existingProviders={existingProviders}
        onSaved={fetchCredentials}
      />

      <TestMessageDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        credential={testMessageCredential}
      />

      <StatusResultDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        result={statusResult}
        loading={statusLoading}
      />

      <ConfirmationDialog
        open={!!deactivateId}
        onOpenChange={(open) => {
          if (!open) setDeactivateId(null);
        }}
        title="Desativar Provedor"
        description="Tem certeza que deseja desativar este provedor? O envio de mensagens por ele será interrompido. Você pode reativá-lo posteriormente."
        confirmLabel="Sim, Desativar"
        destructive
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
