"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ApiError } from "@/lib/api";
import type { StaffResponse, StaffPermissions } from "@/types";
import { createStaff, updateStaff } from "@/services/staff";

// ===================== Permission module config =====================

type PermModule = {
  label: string;
  view: keyof StaffPermissions | null;
  manage: keyof StaffPermissions | null;
};

const PERM_MODULES: PermModule[] = [
  { label: "Clientes", view: "view_clients", manage: "manage_clients" },
  { label: "Lotes / Imóveis", view: "view_lots", manage: "manage_lots" },
  { label: "Financeiro / Boletos", view: "view_financial", manage: "manage_financial" },
  { label: "Renegociações", view: "view_renegotiations", manage: "manage_renegotiations" },
  { label: "Distratos", view: "view_rescissions", manage: "manage_rescissions" },
  { label: "Relatórios", view: "view_reports", manage: null },
  { label: "Solicitações de Serviço", view: "view_service_requests", manage: "manage_service_requests" },
  { label: "Documentos", view: "view_documents", manage: "manage_documents" },
  { label: "Sicredi", view: null, manage: "manage_sicredi" },
  { label: "WhatsApp", view: null, manage: "manage_whatsapp" },
  { label: "Config. Financeiras", view: "view_financial_settings", manage: "manage_financial_settings" },
];

const DEFAULT_PERMISSIONS: StaffPermissions = {
  view_clients: false,
  manage_clients: false,
  view_lots: false,
  manage_lots: false,
  view_financial: false,
  manage_financial: false,
  view_renegotiations: false,
  manage_renegotiations: false,
  view_rescissions: false,
  manage_rescissions: false,
  view_reports: false,
  view_service_requests: false,
  manage_service_requests: false,
  view_documents: false,
  manage_documents: false,
  view_sicredi: false,
  manage_sicredi: false,
  view_whatsapp: false,
  manage_whatsapp: false,
  view_financial_settings: false,
  manage_financial_settings: false,
};

// ===================== Schema =====================

const createSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  email: z.string().email("E-mail inválido"),
  cpf_cnpj: z.string().min(11, "Mínimo 11 caracteres").max(20),
  phone: z.string().min(8, "Mínimo 8 caracteres").max(20),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const editSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  phone: z.string().min(8, "Mínimo 8 caracteres").max(20),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

// ===================== Props =====================

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffResponse | null;
  onSuccess: () => void;
}

// ===================== Component =====================

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: StaffFormDialogProps) {
  const isEditing = !!staff;
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<StaffPermissions>({ ...DEFAULT_PERMISSIONS });

  const form = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEditing ? editSchema : createSchema) as never,
    defaultValues: isEditing
      ? { full_name: "", phone: "", password: "" }
      : { full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      if (staff) {
        form.reset({ full_name: staff.full_name, phone: staff.phone, password: "" });
        setPermissions(staff.permissions ?? { ...DEFAULT_PERMISSIONS });
      } else {
        form.reset({ full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" });
        setPermissions({ ...DEFAULT_PERMISSIONS });
      }
      setShowPassword(false);
    }
  }, [open, staff, form]);

  function handlePermChange(key: keyof StaffPermissions, value: boolean) {
    setPermissions((prev) => {
      const next = { ...prev, [key]: value };

      if (value) {
        const mod = PERM_MODULES.find((m) => m.manage === key);
        if (mod?.view) next[mod.view] = true;
      } else {
        const mod = PERM_MODULES.find((m) => m.view === key);
        if (mod?.manage) next[mod.manage] = false;
      }

      return next;
    });
  }

  async function onSubmit(data: CreateFormData | EditFormData) {
    try {
      if (isEditing && staff) {
        const updateData: Parameters<typeof updateStaff>[1] = {
          full_name: data.full_name,
          phone: data.phone,
          permissions,
        };
        const pwd = (data as EditFormData).password;
        if (pwd && pwd.length > 0) updateData.password = pwd;
        await updateStaff(staff.id, updateData);
        toast.success("Funcionário atualizado com sucesso.");
      } else {
        const d = data as CreateFormData;
        await createStaff({
          full_name: d.full_name,
          email: d.email,
          cpf_cnpj: d.cpf_cnpj,
          phone: d.phone,
          password: d.password,
          permissions,
        });
        toast.success("Funcionário criado com sucesso.");
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error("E-mail ou CPF/CNPJ já cadastrado.");
        } else {
          toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar funcionário");
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {isEditing ? `Editar — ${staff?.full_name}` : "Novo Funcionário"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <Form {...form}>
            <form
              id="staff-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-6 py-4 space-y-6"
            >
              {/* Basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="joao@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpf_cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF / CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="51999998888" {...field} />
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
                      <FormLabel>
                        Senha{isEditing && <span className="text-muted-foreground font-normal ml-1">(opcional)</span>}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={isEditing ? "Deixe em branco para manter" : "Mínimo 8 caracteres"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Permissions table */}
              <div>
                <p className="text-sm font-semibold mb-3">Permissões</p>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Módulo</th>
                        <th className="text-center px-4 py-2 font-medium text-muted-foreground w-24">Ver</th>
                        <th className="text-center px-4 py-2 font-medium text-muted-foreground w-28">Gerenciar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERM_MODULES.map((mod, idx) => (
                        <tr
                          key={mod.label}
                          className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="px-4 py-2.5 font-medium">{mod.label}</td>
                          <td className="px-4 py-2.5 text-center">
                            {mod.view ? (
                              <Switch
                                checked={permissions[mod.view]}
                                onCheckedChange={(v) => handlePermChange(mod.view!, v)}
                                aria-label={`Ver ${mod.label}`}
                              />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {mod.manage ? (
                              <Switch
                                checked={permissions[mod.manage]}
                                onCheckedChange={(v) => handlePermChange(mod.manage!, v)}
                                aria-label={`Gerenciar ${mod.label}`}
                              />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="staff-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
