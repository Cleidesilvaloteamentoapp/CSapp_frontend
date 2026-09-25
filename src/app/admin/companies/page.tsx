"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2, Plus, ShieldCheck, UserPlus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/auth-context";
import {
  createCompany,
  createCompanyAdmin,
  listCompanies,
  listCompanyAdmins,
  updateCompanyStatus,
} from "@/services/admin";
import type { CompanyAdminResponse, CompanyResponse } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  INACTIVE: "Inativa",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Platform console: the only screen that works across companies.
 *
 * The /companies endpoints have existed all along with no UI at all, so a
 * super admin could not see the companies it owned, let alone give a new one
 * an administrator — which left every created company an empty shell.
 */
export default function CompaniesPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useAuth();

  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const [adminTarget, setAdminTarget] = useState<CompanyResponse | null>(null);
  const [admins, setAdmins] = useState<CompanyAdminResponse[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    cpf_cnpj: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) router.replace("/admin/dashboard");
  }, [authLoading, isSuperAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCompanies({ per_page: 50, search: search || undefined });
      setCompanies(res.items ?? []);
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao carregar empresas"
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  async function handleCreate() {
    setSaving(true);
    try {
      await createCompany({ name: newName, slug: newSlug || slugify(newName) });
      toast.success("Empresa criada. Agora cadastre o administrador dela.");
      setCreateOpen(false);
      setNewName("");
      setNewSlug("");
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao criar empresa"
      );
    } finally {
      setSaving(false);
    }
  }

  async function openAdmins(company: CompanyResponse) {
    setAdminTarget(company);
    setAdminsLoading(true);
    setAdminForm({ full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" });
    try {
      setAdmins(await listCompanyAdmins(company.id));
    } catch {
      toast.error("Erro ao carregar os administradores");
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  }

  async function handleCreateAdmin() {
    if (!adminTarget) return;
    setSaving(true);
    try {
      await createCompanyAdmin(adminTarget.id, adminForm);
      toast.success("Administrador criado. Ele já pode entrar na plataforma.");
      setAdmins(await listCompanyAdmins(adminTarget.id));
      setAdminForm({ full_name: "", email: "", cpf_cnpj: "", phone: "", password: "" });
    } catch (err) {
      toast.error(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Erro ao criar administrador"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(company: CompanyResponse, status: string) {
    try {
      await updateCompanyStatus(company.id, status);
      toast.success(
        status === "ACTIVE"
          ? "Empresa reativada."
          : "Empresa suspensa — os usuários dela não conseguem mais entrar."
      );
      load();
    } catch {
      toast.error("Erro ao alterar o status");
    }
  }

  if (authLoading || !isSuperAdmin) return null;

  const adminFormComplete =
    adminForm.full_name.length > 2 &&
    adminForm.email.includes("@") &&
    adminForm.cpf_cnpj.length >= 11 &&
    adminForm.phone.length >= 10 &&
    adminForm.password.length >= 8;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas da plataforma"
        description="Console do super admin: criar, suspender e dar administrador a cada empresa"
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova empresa
        </Button>
      </PageHeader>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">
              Esta é a única tela que enxerga além da sua empresa.
            </p>
            <p className="mt-1">
              O administrador de cada empresa manda em tudo dentro dela — clientes,
              lotes, boletos, funcionários — mas não vê nem cria outras empresas.
              Criar empresa e nomear o administrador dela é função do super admin.
            </p>
          </div>
        </CardContent>
      </Card>

      <Input
        placeholder="Buscar por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={5} />
            </div>
          ) : companies.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma empresa encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          c.status === "ACTIVE"
                            ? "border-0 bg-success/10 text-success"
                            : "border-0 bg-destructive/10 text-destructive"
                        }
                      >
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openAdmins(c)}>
                          <UserPlus className="mr-1 h-4 w-4" />
                          Administradores
                        </Button>
                        <Select
                          value={c.status}
                          onValueChange={(v) => handleStatus(c, v)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Ativa</SelectItem>
                            <SelectItem value="SUSPENDED">Suspensa</SelectItem>
                            <SelectItem value="INACTIVE">Inativa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create company */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
            <DialogDescription>
              Depois de criar, cadastre o administrador — sem ele ninguém consegue
              entrar na empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(slugify(e.target.value));
                }}
                className="mt-1"
                placeholder="Loteamentos Exemplo Ltda"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Identificador (slug) *</label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
                className="mt-1 font-mono"
                placeholder="loteamentos-exemplo"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Usado na URL pública da identidade visual. Só letras, números e hífen.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving || !newName || !newSlug}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar empresa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company admins */}
      <Dialog open={adminTarget !== null} onOpenChange={(o) => !o && setAdminTarget(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Administradores — {adminTarget?.name}</DialogTitle>
            <DialogDescription>
              Quem administra esta empresa. O administrador tem controle total dentro
              dela e nenhum acesso às outras.
            </DialogDescription>
          </DialogHeader>

          {adminsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {admins.length > 0 ? (
                <div className="space-y-2">
                  {admins.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                      </div>
                      <Badge variant="outline">{a.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Esta empresa ainda não tem administrador — ninguém consegue entrar
                  nela. Cadastre um abaixo.
                </p>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Novo administrador</CardTitle>
                  <CardDescription className="text-xs">
                    Ele entra com este e-mail e senha e já administra a empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Nome completo"
                    value={adminForm.full_name}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, full_name: e.target.value })
                    }
                  />
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder="CPF/CNPJ (só números)"
                      value={adminForm.cpf_cnpj}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          cpf_cnpj: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                    <Input
                      placeholder="Telefone"
                      value={adminForm.phone}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    type="password"
                    placeholder="Senha (mín. 8, com maiúscula, número e símbolo)"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleCreateAdmin}
                      disabled={saving || !adminFormComplete}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar administrador
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
