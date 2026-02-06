"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, MapPin, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { api, ApiError } from "@/lib/api";
import { developmentCreateSchema, type DevelopmentCreateFormData } from "@/lib/validators";
import { formatDate } from "@/lib/format";
import type { DevelopmentResponse } from "@/types";

export default function DevelopmentsPage() {
  const [developments, setDevelopments] = useState<DevelopmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DevelopmentResponse | null>(null);

  const form = useForm<DevelopmentCreateFormData>({
    resolver: zodResolver(developmentCreateSchema) as never,
    defaultValues: { name: "", description: "", location: "" },
  });

  async function loadDevelopments() {
    try {
      const data = await api.get<DevelopmentResponse[]>("/admin/developments/");
      setDevelopments(data);
    } catch (error) {
      if (error instanceof ApiError) toast.error("Erro ao carregar empreendimentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDevelopments(); }, []);

  function openForm(dev?: DevelopmentResponse) {
    if (dev) {
      setEditing(dev);
      form.reset({ name: dev.name, description: dev.description || "", location: dev.location || "" });
    } else {
      setEditing(null);
      form.reset({ name: "", description: "", location: "" });
    }
    setFormOpen(true);
  }

  async function onSubmit(data: DevelopmentCreateFormData) {
    try {
      if (editing) {
        await api.put(`/admin/developments/${editing.id}`, data);
        toast.success("Empreendimento atualizado");
      } else {
        await api.post("/admin/developments/", data);
        toast.success("Empreendimento criado");
      }
      setFormOpen(false);
      loadDevelopments();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao salvar");
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Empreendimentos" description="Gerencie seus loteamentos e empreendimentos">
        <Button onClick={() => openForm()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Empreendimento
        </Button>
      </PageHeader>

      {loading ? (
        <StatsCardsSkeleton count={3} />
      ) : developments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum empreendimento cadastrado</p>
            <Button onClick={() => openForm()}>
              <Plus className="mr-2 h-4 w-4" /> Cadastrar primeiro empreendimento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developments.map((dev) => (
            <Card key={dev.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dev.name}</CardTitle>
                    {dev.location && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {dev.location}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openForm(dev)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dev.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{dev.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Criado em {formatDate(dev.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empreendimento" : "Novo Empreendimento"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do empreendimento" : "Preencha os dados do novo empreendimento"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input placeholder="Residencial Parque" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl><Input placeholder="Rodovia SP-100, km 25" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea placeholder="Detalhes sobre o empreendimento..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : editing ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
