"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Activity,
  AlertTriangle,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useSicrediCredentials } from "@/hooks/use-sicredi";
import { getIntegrationHealth, type IntegrationHealth } from "@/services/sicredi";
import { formatDateTime } from "@/lib/format";
import type { SicrediCredentialsRequest } from "@/types/sicredi";

const credentialsSchema = z.object({
  x_api_key: z.string().min(1, "API Key é obrigatória"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  cooperativa: z
    .string()
    .regex(/^\d{4}$/, "Cooperativa deve ter 4 dígitos"),
  posto: z.string().regex(/^\d{2}$/, "Posto deve ter 2 dígitos"),
  codigo_beneficiario: z.string().min(1, "Código do beneficiário é obrigatório"),
  environment: z.enum(["sandbox", "production"]),
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

export default function SicrediConfigPage() {
  const { credentials, loading, saving, error, save } =
    useSicrediCredentials();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] =
    useState<SicrediCredentialsRequest | null>(null);
  const [health, setHealth] = useState<IntegrationHealth | null>(null);

  useEffect(() => {
    if (!credentials) return;
    getIntegrationHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, [credentials]);

  const syncIsStale =
    !health?.last_sync_run_at ||
    Date.now() - new Date(health.last_sync_run_at).getTime() > 2 * 60 * 60 * 1000;
  const contractOk = health?.webhook_contract?.status === "ok";

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema) as any,
    defaultValues: {
      x_api_key: "",
      username: "",
      password: "",
      cooperativa: credentials?.cooperativa || "",
      posto: credentials?.posto || "",
      codigo_beneficiario: credentials?.codigo_beneficiario || "",
      environment: credentials?.environment || "sandbox",
    },
    values: credentials
      ? {
          x_api_key: "",
          username: "",
          password: "",
          cooperativa: credentials.cooperativa,
          posto: credentials.posto,
          codigo_beneficiario: credentials.codigo_beneficiario,
          environment: credentials.environment,
        }
      : undefined,
  });

  function onSubmit(values: CredentialsFormValues) {
    setPendingData(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingData) return;
    const result = await save(pendingData);
    setConfirmOpen(false);
    setPendingData(null);
    if (result) {
      toast.success("Credenciais salvas com sucesso");
      form.reset({
        x_api_key: "",
        username: "",
        password: "",
        cooperativa: result.cooperativa,
        posto: result.posto,
        codigo_beneficiario: result.codigo_beneficiario,
        environment: result.environment,
      });
    } else {
      toast.error(error || "Erro ao salvar credenciais");
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações Sicredi"
        description="Gerencie as credenciais de integração com o Sicredi"
      />

      {credentials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status da Integração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Ambiente:
                </span>
                <Badge
                  variant={
                    credentials.environment === "production"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {credentials.environment === "production"
                    ? "Produção"
                    : "Sandbox"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Token:</span>
                {credentials.has_valid_token ? (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Válido
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Inválido / Expirado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Cooperativa:
                </span>
                <span className="text-sm font-medium">
                  {credentials.cooperativa} / {credentials.posto}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Beneficiário:
                </span>
                <span className="text-sm font-medium">
                  {credentials.codigo_beneficiario}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {credentials && health && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Saúde da Integração
            </CardTitle>
            <CardDescription>
              Confirma que os webhooks e a sincronização automática estão ativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Contrato de webhook:</span>
                {contractOk ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Não registrado / erro
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sincronização automática:</span>
                {syncIsStale ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Sem execução recente
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Ativa
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Último webhook recebido:</span>
                <span className="font-medium">
                  {health.last_webhook_received_at
                    ? formatDateTime(health.last_webhook_received_at)
                    : "Nunca"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última sincronização:</span>
                <span className="font-medium">
                  {health.last_sync_run_at
                    ? formatDateTime(health.last_sync_run_at)
                    : "Nunca"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última reconciliação:</span>
                <span className="font-medium">
                  {health.last_reconcile_at
                    ? formatDateTime(health.last_reconcile_at)
                    : "Nunca"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Boletos em aberto:</span>
                <span className="font-medium">{health.open_boletos}</span>
              </div>
            </div>
            {(syncIsStale || !contractOk) && (
              <p className="text-xs text-amber-600">
                Verifique os serviços de background (beat/worker) e o registro do contrato de webhook.
                Consulte a{" "}
                <a href="/admin/sicredi-events" className="underline">Auditoria Sicredi</a>{" "}
                para detalhes.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {credentials
              ? "Atualizar Credenciais"
              : "Cadastrar Credenciais"}
          </CardTitle>
          <CardDescription>
            {credentials
              ? "Preencha apenas os campos que deseja atualizar. API Key e Senha são sempre obrigatórios por segurança."
              : "Configure as credenciais do portal desenvolvedor Sicredi para habilitar a emissão de boletos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="x_api_key"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showApiKey ? "text" : "password"}
                            placeholder="UUID do portal desenvolvedor"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Código do usuário" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Código de acesso Internet Banking"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cooperativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cooperativa</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0100"
                          maxLength={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="posto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="01"
                          maxLength={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo_beneficiario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Beneficiário</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambiente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ambiente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sandbox">
                            Sandbox (Testes)
                          </SelectItem>
                          <SelectItem value="production">
                            Produção
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <PermissionGuard permission="manage_sicredi">
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Credenciais"
                    )}
                  </Button>
                </div>
              </PermissionGuard>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Salvar Credenciais Bancárias"
        description="Você está prestes a salvar credenciais de acesso ao sistema bancário Sicredi. Confirme que os dados estão corretos antes de prosseguir."
        confirmLabel="Sim, Salvar Credenciais"
        loading={saving}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
