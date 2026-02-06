"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { clientCreateSchema, type ClientCreateFormData } from "@/lib/validators";
import { api, ApiError } from "@/lib/api";
import type { ClientResponse } from "@/types";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientResponse | null;
  onSuccess: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const isEditing = !!client;

  const form = useForm<ClientCreateFormData>({
    resolver: zodResolver(clientCreateSchema) as never,
    defaultValues: {
      email: "",
      full_name: "",
      cpf_cnpj: "",
      phone: "",
      address: { street: "", number: "", city: "", state: "", zip: "" },
      create_access: false,
      password: "",
    },
  });

  const watchCreateAccess = form.watch("create_access");

  useEffect(() => {
    if (client) {
      const addr = (client.address as Record<string, string>) || {};
      form.reset({
        email: client.email,
        full_name: client.full_name,
        cpf_cnpj: client.cpf_cnpj,
        phone: client.phone,
        address: {
          street: addr.street || "",
          number: addr.number || "",
          city: addr.city || "",
          state: addr.state || "",
          zip: addr.zip || "",
        },
        create_access: false,
        password: "",
      });
    } else {
      form.reset({
        email: "",
        full_name: "",
        cpf_cnpj: "",
        phone: "",
        address: { street: "", number: "", city: "", state: "", zip: "" },
        create_access: false,
        password: "",
      });
    }
  }, [client, form, open]);

  async function onSubmit(data: ClientCreateFormData) {
    try {
      if (isEditing) {
        await api.put(`/admin/clients/${client.id}`, {
          email: data.email,
          full_name: data.full_name,
          cpf_cnpj: data.cpf_cnpj,
          phone: data.phone,
          address: data.address,
        });
        toast.success("Cliente atualizado com sucesso");
      } else {
        await api.post("/admin/clients", data);
        toast.success("Cliente cadastrado com sucesso");
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error("E-mail ou CPF/CNPJ já cadastrado");
        } else {
          toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar cliente");
        }
      } else {
        toast.error("Erro de conexão");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do cliente" : "Preencha os dados do novo cliente"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                      <Input placeholder="11999990000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cpf_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Endereço</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Rua</FormLabel>
                      <FormControl><Input placeholder="Rua das Flores" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl><Input placeholder="123" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl><Input placeholder="SP" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl><Input placeholder="01001-000" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isEditing && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Criar acesso ao portal</p>
                    <p className="text-xs text-muted-foreground">O cliente poderá fazer login</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="create_access"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {watchCreateAccess && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do cliente</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
