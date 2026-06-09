"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Bell, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/services/whatsapp";
import type { NotificationSettingsResponse } from "@/types/whatsapp";

// ===================== Schema =====================

const schema = z.object({
  notify_client_new_boleto: z.boolean(),
  notify_client_due_reminder: z.boolean(),
  notify_client_overdue: z.boolean(),
  notify_client_service: z.boolean(),
  notify_admin_client_created: z.boolean(),
  notify_admin_client_deleted: z.boolean(),
  notify_admin_boleto_generated: z.boolean(),
  notify_admin_boleto_cancelled: z.boolean(),
  notify_admin_cycle_request: z.boolean(),
  admin_whatsapp_numbers: z
    .string()
    .max(2000)
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      return val.split(",").every((n) => /^\d{12,15}$/.test(n.trim()));
    }, "Cada número deve ter 12-15 dígitos (ex: 5511999990000). Separe múltiplos por vírgula."),
});

type FormValues = z.infer<typeof schema>;

// ===================== Toggle row =====================

function ToggleRow({
  control,
  name,
  label,
  description,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3 gap-4">
          <div className="space-y-0.5">
            <FormLabel className="text-sm font-medium leading-none">
              {label}
            </FormLabel>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

// ===================== Main component =====================

export function NotificationSettingsTab() {
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      notify_client_new_boleto: true,
      notify_client_due_reminder: true,
      notify_client_overdue: true,
      notify_client_service: true,
      notify_admin_client_created: true,
      notify_admin_client_deleted: true,
      notify_admin_boleto_generated: true,
      notify_admin_boleto_cancelled: true,
      notify_admin_cycle_request: true,
      admin_whatsapp_numbers: "",
    },
  });

  useEffect(() => {
    getNotificationSettings()
      .then((data: NotificationSettingsResponse) => {
        form.reset({
          notify_client_new_boleto: data.notify_client_new_boleto,
          notify_client_due_reminder: data.notify_client_due_reminder,
          notify_client_overdue: data.notify_client_overdue,
          notify_client_service: data.notify_client_service,
          notify_admin_client_created: data.notify_admin_client_created,
          notify_admin_client_deleted: data.notify_admin_client_deleted,
          notify_admin_boleto_generated: data.notify_admin_boleto_generated,
          notify_admin_boleto_cancelled: data.notify_admin_boleto_cancelled,
          notify_admin_cycle_request: data.notify_admin_cycle_request,
          admin_whatsapp_numbers: data.admin_whatsapp_numbers ?? "",
        });
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError ? err.message : "Erro ao carregar preferências";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateNotificationSettings({
        ...values,
        admin_whatsapp_numbers: values.admin_whatsapp_numbers?.trim() || undefined,
      });
      toast.success("Preferências de notificação salvas");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Erro ao salvar preferências";
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Notificações para o Cliente</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Enviadas via WhatsApp para o número cadastrado do cliente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              control={form.control}
              name="notify_client_new_boleto"
              label="Novo boleto gerado"
              description="Envia link do portal e linha digitável ao cliente quando um boleto é emitido"
            />
            <ToggleRow
              control={form.control}
              name="notify_client_due_reminder"
              label="Lembrete de vencimento"
              description="Lembrete automático 7 dias antes e no dia do vencimento"
            />
            <ToggleRow
              control={form.control}
              name="notify_client_overdue"
              label="Aviso de atraso"
              description="Notificação quando o boleto passa a estar em atraso"
            />
            <ToggleRow
              control={form.control}
              name="notify_client_service"
              label="Atualização de serviço"
              description="Aviso quando uma ordem de serviço é atualizada"
            />
          </CardContent>
        </Card>

        {/* Admin notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Notificações para o Admin</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Enviadas como notificação in-app e WhatsApp para os números abaixo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              control={form.control}
              name="notify_admin_client_created"
              label="Cadastro de cliente"
              description="Aviso quando um novo cliente é cadastrado"
            />
            <ToggleRow
              control={form.control}
              name="notify_admin_client_deleted"
              label="Exclusão de cliente"
              description="Aviso quando um cliente é excluído do sistema"
            />
            <ToggleRow
              control={form.control}
              name="notify_admin_boleto_generated"
              label="Geração de boleto"
              description="Aviso quando um boleto é emitido pelo Sicredi"
            />
            <ToggleRow
              control={form.control}
              name="notify_admin_boleto_cancelled"
              label="Cancelamento de boleto"
              description="Aviso quando um boleto é cancelado"
            />
            <ToggleRow
              control={form.control}
              name="notify_admin_cycle_request"
              label="Solicitações de reajuste"
              description="Aviso quando um ciclo de 12 parcelas é concluído e requer aprovação de reajuste"
            />

            {/* Admin numbers */}
            <FormField
              control={form.control}
              name="admin_whatsapp_numbers"
              render={({ field, fieldState }) => (
                <FormItem className="pt-2">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <Bell className="h-3.5 w-3.5" />
                    Números WhatsApp dos admins
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="5511999990000, 5511888880001"
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Formato internacional sem + (DDI+DDD+número). Separe múltiplos por vírgula.
                  </p>
                  {fieldState.error && (
                    <p className="text-[11px] text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
