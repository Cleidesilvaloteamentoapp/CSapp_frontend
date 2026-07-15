"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus, Search, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { clientCreateSchema, type ClientCreateFormData } from "@/lib/validators";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { formatCep, onlyDigits } from "@/lib/cep";
import { ClientSelector } from "@/components/sicredi/client-selector";
import { ClientPortalAccessDialog } from "@/components/shared/client-portal-access-dialog";
import type { ClientResponse } from "@/types";
import { HelpHint } from "./help-hint";

interface StepClienteProps {
  selectedClient: ClientResponse | null;
  onClientSelect: (client: ClientResponse, mode: "EXISTING" | "NEW") => void;
  onClear: () => void;
}

export function StepCliente({ selectedClient, onClientSelect, onClear }: StepClienteProps) {
  const [mode, setMode] = useState<"SELECT" | "CREATE">(selectedClient ? "SELECT" : "CREATE");
  const [portalDialog, setPortalDialog] = useState<{
    open: boolean;
    mode: "create" | "reset";
  }>({ open: false, mode: "create" });

  const form = useForm<ClientCreateFormData>({
    resolver: zodResolver(clientCreateSchema) as never,
    defaultValues: {
      email: "",
      full_name: "",
      cpf_cnpj: "",
      phone: "",
      address: { street: "", number: "", neighborhood: "", city: "", state: "", zip: "" },
      create_access: false,
      password: "",
    },
  });

  const watchCreateAccess = form.watch("create_access");

  const cep = useCepLookup({
    onFound: (address) => {
      if (address.street) form.setValue("address.street", address.street, { shouldDirty: true });
      if (address.neighborhood) form.setValue("address.neighborhood", address.neighborhood, { shouldDirty: true });
      if (address.city) form.setValue("address.city", address.city, { shouldDirty: true });
      if (address.state) form.setValue("address.state", address.state, { shouldDirty: true });
      form.setFocus("address.number");
    },
    onError: (message) => toast.error(message),
  });

  async function handleCreateSubmit(data: ClientCreateFormData) {
    try {
      const res = await api.post<ClientResponse>("/admin/clients", data);
      toast.success("Cliente cadastrado com sucesso");
      onClientSelect(res, "NEW");
    } catch (error) {
      if (error instanceof ApiError) {
        const msg = typeof error.detail === "string" ? error.detail : "";
        const isDuplicate =
          error.status === 409 ||
          msg.toLowerCase().includes("cpf_cnpj") ||
          msg.toLowerCase().includes("duplicate") ||
          msg.toLowerCase().includes("já cadastrado") ||
          msg.toLowerCase().includes("já existe");
        toast.error(
          isDuplicate ? "CPF/CNPJ ou e-mail já cadastrado. Verifique se o cliente já existe." : msg || "Erro ao salvar cliente"
        );
      } else {
        toast.error("Erro de conexão");
      }
    }
  }

  function handleClientSelect(_id: string, client: ClientResponse) {
    onClientSelect(client, "EXISTING");
    setMode("SELECT");
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "SELECT" | "CREATE");
          if (v === "CREATE") onClear();
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="SELECT">
            <Search className="mr-2 h-4 w-4" />
            Selecionar Existente
          </TabsTrigger>
          <TabsTrigger value="CREATE">
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar Novo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="SELECT" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">Selecione um cliente</p>
                  <HelpHint text="Busque pelo nome, CPF/CNPJ ou e-mail. Se o cliente ainda não existe, use a aba 'Cadastrar Novo'." />
                </div>
                <ClientSelector
                  value={selectedClient?.id ?? null}
                  onChange={handleClientSelect}
                  onCreateNew={() => setMode("CREATE")}
                />
              </div>
              {selectedClient && (
                <>
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                    <p className="font-semibold">{selectedClient.full_name}</p>
                    <p className="text-muted-foreground">
                      {selectedClient.cpf_cnpj} &bull; {selectedClient.email} &bull; {selectedClient.phone}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border p-3 ${
                      selectedClient.profile_id
                        ? "border-green-200 bg-green-50/50"
                        : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-2 min-w-0">
                        {selectedClient.profile_id ? (
                          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                        ) : (
                          <KeyRound className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                        )}
                        <div className="text-sm">
                          {selectedClient.profile_id ? (
                            <>
                              <p className="font-medium text-green-800">Acesso ao portal ativo</p>
                              <p className="text-xs text-green-700">
                                Cliente pode logar com {selectedClient.email}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-amber-800">Sem acesso ao portal</p>
                              <p className="text-xs text-amber-700">
                                O cliente não pode logar no portal para ver parcelas/documentos.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedClient.profile_id ? "outline" : "default"}
                        onClick={() =>
                          setPortalDialog({
                            open: true,
                            mode: selectedClient.profile_id ? "reset" : "create",
                          })
                        }
                      >
                        {selectedClient.profile_id ? "Editar senha" : "Criar acesso"}
                      </Button>
                    </div>
                  </div>
                  <ClientPortalAccessDialog
                    open={portalDialog.open}
                    onOpenChange={(o) => setPortalDialog((p) => ({ ...p, open: o }))}
                    clientId={selectedClient.id}
                    clientName={selectedClient.full_name}
                    mode={portalDialog.mode}
                    onSuccess={() => {
                      // Mark as having portal access locally
                      onClientSelect(
                        { ...selectedClient, profile_id: selectedClient.profile_id ?? "pending" },
                        "EXISTING"
                      );
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="CREATE" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              {/* Portal access — pulled up so it's not forgotten */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <KeyRound className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Criar acesso ao portal do cliente</p>
                        <p className="text-xs text-muted-foreground">
                          Permite que o cliente acompanhe parcelas, baixe boletos e envie documentos.
                          <HelpHint text="Recomendado para todos os clientes. Sem o portal, o cliente depende do administrador para receber documentos e segunda via." />
                        </p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="create_access"
                      render={({ field }) => (
                        <FormItem className="shrink-0">
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
                            <Input
                              type="password"
                              placeholder="Mínimo 8 caracteres"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome Completo
                          <HelpHint text="Nome completo conforme documento. Será usado no contrato e na ficha do cliente." />
                        </FormLabel>
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
                          <FormLabel>
                            E-mail
                            <HelpHint text="E-mail único. O sistema não permite duplicidade de e-mail ou CPF/CNPJ." />
                          </FormLabel>
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
                        <FormLabel>
                          CPF / CNPJ
                          <HelpHint text="Apenas números. CPF = 11 dígitos, CNPJ = 14 dígitos. Não pode repetir cadastro." />
                        </FormLabel>
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
                        name="address.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              CEP
                              <HelpHint text="Digite o CEP para preencher rua, bairro, cidade e estado automaticamente." />
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="01001-000"
                                  inputMode="numeric"
                                  maxLength={9}
                                  {...field}
                                  onChange={(e) => {
                                    const masked = formatCep(e.target.value);
                                    field.onChange(masked);
                                    if (onlyDigits(masked).length === 8) cep.lookup(masked);
                                  }}
                                  onBlur={(e) => {
                                    field.onBlur();
                                    cep.lookup(e.target.value);
                                  }}
                                />
                                {cep.loading && (
                                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua das Flores" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="address.number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.neighborhood"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Centro" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="São Paulo" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="SP" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cadastrando...</>
                      ) : (
                        "Cadastrar Cliente"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
