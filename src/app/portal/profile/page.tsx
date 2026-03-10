"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { getClientProfile, updateClientProfile } from "@/services/portal";
import type { ClientProfile, ClientProfileUpdate } from "@/types/portal";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Ativo", variant: "default" },
  INACTIVE: { label: "Inativo", variant: "secondary" },
  DEFAULTER: { label: "Inadimplente", variant: "destructive" },
  RESCINDED: { label: "Rescindido", variant: "destructive" },
};

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getClientProfile();
      setProfile(data);
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setStreet(data.address?.street || "");
      setNumber(data.address?.number || "");
      setCity(data.address?.city || "");
      setState(data.address?.state || "");
      setZip(data.address?.zip || "");
    } catch {
      toast.error("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const update: ClientProfileUpdate = {
        email,
        phone,
        address: { street, number, city, state, zip },
      };
      const updated = await updateClientProfile(update);
      setProfile(updated);
      toast.success("Perfil atualizado com sucesso");
    } catch {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu Perfil" description="Visualize e edite seus dados" />
        <TableSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu Perfil" description="Visualize e edite seus dados" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Perfil não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = STATUS_LABELS[profile.status] || STATUS_LABELS.ACTIVE;

  return (
    <div className="space-y-6">
      <PageHeader title="Meu Perfil" description="Visualize e edite seus dados" />

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
          <CardDescription>Informações vinculadas ao seu cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome Completo</label>
              <p className="text-sm font-medium mt-0.5">{profile.full_name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">CPF/CNPJ</label>
              <p className="text-sm font-medium mt-0.5">{profile.cpf_cnpj}</p>
            </div>
            {profile.contract_number && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Contrato</label>
                <p className="text-sm font-medium mt-0.5">{profile.contract_number}</p>
              </div>
            )}
            {profile.matricula && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Matrícula</label>
                <p className="text-sm font-medium mt-0.5">{profile.matricula}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="mt-0.5">
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de Contato</CardTitle>
          <CardDescription>Você pode atualizar e-mail, telefone e endereço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          <p className="text-sm font-medium">Endereço</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Rua</label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número</label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CEP</label>
              <Input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cidade</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Salvar Alterações</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
