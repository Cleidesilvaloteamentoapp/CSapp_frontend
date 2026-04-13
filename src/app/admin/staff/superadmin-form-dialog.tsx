"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ApiError } from "@/lib/api";
import { createSuperadmin } from "@/lib/auth";
import { updateStaff } from "@/services/staff";
import type { SuperadminResponse } from "@/types";

const createSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  email: z.string().email("E-mail inválido"),
  cpf_cnpj: z.string().min(11, "Mínimo 11 caracteres").max(20),
  phone: z.string().min(8, "Mínimo 8 caracteres").max(20),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

const editSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  phone: z.string().min(8, "Mínimo 8 caracteres").max(20),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128).optional().or(z.literal("")),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface SuperadminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  superadmin: SuperadminResponse | null;
  onSuccess: () => void;
}

export function SuperadminFormDialog({
  open,
  onOpenChange,
  superadmin,
  onSuccess,
}: SuperadminFormDialogProps) {
  const isEditing = !!superadmin;
  // SuperadminResponse is used here (no permissions field needed)
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEditing ? editSchema : createSchema) as never,
    defaultValues: isEditing
      ? { full_name: "", phone: "", password: "" }
      : { full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      if (superadmin) {
        form.reset({ full_name: superadmin.full_name, phone: superadmin.phone, password: "" });
      } else {
        form.reset({ full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" });
      }
      setShowPassword(false);
    }
  }, [open, superadmin, form]);

  async function onSubmit(data: CreateFormData | EditFormData) {
    try {
      if (isEditing && superadmin) {
        const updateData: Parameters<typeof updateStaff>[1] = {
          full_name: data.full_name,
          phone: data.phone,
        };
        const pwd = (data as EditFormData).password;
        if (pwd && pwd.length > 0) updateData.password = pwd;
        await updateStaff(superadmin.id, updateData);
        toast.success(`Superadmin ${data.full_name} atualizado com sucesso.`);
      } else {
        const d = data as CreateFormData;
        await createSuperadmin(d);
        toast.success(`Superadmin ${d.full_name} criado com sucesso.`);
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error("E-mail ou CPF/CNPJ já cadastrado.");
        } else if (error.status === 403) {
          toast.error("Sem permissão para esta operação.");
        } else {
          toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar superadmin");
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>
              {isEditing ? `Editar — ${superadmin?.full_name}` : "Novo Superadmin"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do superadmin. Deixe a senha em branco para mantê-la."
              : "Cria outro superadmin para a mesma empresa. Terá acesso total ao sistema."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="superadmin-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
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
              </div>
            )}

            {isEditing && (
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
            )}

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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" form="superadmin-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  "Salvar"
                ) : (
                  "Criar superadmin"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
