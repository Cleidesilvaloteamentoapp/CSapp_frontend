"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ApiError } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import type { StaffResponse, SuperadminResponse } from "@/types";
import {
  listStaff,
  listSuperadmins,
  toggleStaffActive,
  deleteStaff,
} from "@/services/staff";
import { StaffFormDialog } from "./staff-form-dialog";
import { SuperadminFormDialog } from "./superadmin-form-dialog";
import { useAuth } from "@/contexts/auth-context";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [superadminFormOpen, setSuperadminFormOpen] = useState(false);
  const [editingSuperadmin, setEditingSuperadmin] = useState<SuperadminResponse | null>(null);
  const [superadminList, setSuperadminList] = useState<SuperadminResponse[]>([]);
  const { isSuperAdmin, loading: authLoading, user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStaff();
      setStaffList(data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao carregar funcionários");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuperadmins = useCallback(async () => {
    try {
      const data = await listSuperadmins();
      setSuperadminList(data.filter((s) => s.id !== user?.id));
    } catch {
      // endpoint may not exist; silently ignore
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) loadSuperadmins();
  }, [authLoading, isSuperAdmin, loadSuperadmins]);

  async function handleToggleActive(staff: StaffResponse) {
    if (staff.is_active) {
      setDeactivateTarget(staff);
      return;
    }
    setActionLoading(staff.id);
    try {
      await toggleStaffActive(staff.id);
      toast.success(`Conta de ${staff.full_name} ativada.`);
      load();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao ativar conta");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    setActionLoading(deactivateTarget.id);
    setDeactivateTarget(null);
    try {
      await toggleStaffActive(deactivateTarget.id);
      toast.success(`Conta de ${deactivateTarget.full_name} desativada.`);
      load();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao desativar conta");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await deleteStaff(deleteTarget.id);
      toast.success(`Funcionário ${deleteTarget.full_name} excluído.`);
      load();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(typeof error.detail === "string" ? error.detail : "Erro ao excluir funcionário");
      }
    } finally {
      setActionLoading(null);
    }
  }

  function countPermissions(staff: StaffResponse): number {
    if (!staff.permissions) return 0;
    return Object.values(staff.permissions).filter(Boolean).length;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários (Staff)"
        description="Gerencie as contas de funcionários e suas permissões"
      >
        <div className="flex gap-2">
          {!authLoading && isSuperAdmin && (
            <Button variant="outline" onClick={() => { setEditingSuperadmin(null); setSuperadminFormOpen(true); }}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Novo Superadmin
            </Button>
          )}
          <Button onClick={() => { setEditingStaff(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        </div>
      </PageHeader>

      {!authLoading && isSuperAdmin && superadminList.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Outros Superadmins
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {superadminList.map((sa) => (
                  <TableRow key={sa.id} className={sa.is_active ? undefined : "opacity-50"}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sa.full_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{sa.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{sa.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{formatPhone(sa.phone)}</TableCell>
                    <TableCell>
                      {sa.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => { setEditingSuperadmin(sa); setSuperadminFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
              <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setEditingStaff(null); setFormOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar primeiro funcionário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Permissões</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow
                    key={staff.id}
                    className={staff.is_active ? undefined : "opacity-50"}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{staff.full_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{staff.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {staff.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {formatPhone(staff.phone)}
                    </TableCell>
                    <TableCell>
                      {staff.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {countPermissions(staff)} de 21 módulos
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === staff.id}
                          >
                            {actionLoading === staff.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => { setEditingStaff(staff); setFormOpen(true); }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(staff)}>
                            {staff.is_active ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(staff)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StaffFormDialog
        open={formOpen}
        onOpenChange={(open: boolean) => {
          setFormOpen(open);
          if (!open) setEditingStaff(null);
        }}
        staff={editingStaff}
        onSuccess={() => {
          setFormOpen(false);
          setEditingStaff(null);
          load();
        }}
      />

      <ConfirmationDialog
        open={!!deactivateTarget}
        onOpenChange={(open: boolean) => { if (!open) setDeactivateTarget(null); }}
        title="Desativar funcionário"
        description={`Deseja desativar a conta de ${deactivateTarget?.full_name}? O usuário não conseguirá mais fazer login.`}
        confirmLabel="Desativar"
        destructive
        onConfirm={handleConfirmDeactivate}
      />

      <SuperadminFormDialog
        open={superadminFormOpen}
        onOpenChange={(open) => {
          setSuperadminFormOpen(open);
          if (!open) setEditingSuperadmin(null);
        }}
        superadmin={editingSuperadmin}
        onSuccess={() => {
          setSuperadminFormOpen(false);
          setEditingSuperadmin(null);
          loadSuperadmins();
        }}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}
        title="Excluir funcionário"
        description={`Tem certeza que deseja excluir permanentemente a conta de ${deleteTarget?.full_name}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
