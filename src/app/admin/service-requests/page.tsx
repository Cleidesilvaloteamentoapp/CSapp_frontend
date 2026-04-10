"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, TicketCheck, Send, ChevronDown, ChevronUp, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import {
  adminListServiceRequests,
  adminGetServiceRequestStats,
  adminGetServiceRequestDetail,
  adminUpdateServiceRequest,
  adminAddServiceRequestMessage,
} from "@/services/portal";
import {
  REQUEST_STATUS_CONFIG,
  REQUEST_PRIORITY_CONFIG,
  REQUEST_TYPE_LABELS,
} from "@/types/portal";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  ServiceRequestStatus,
  ServiceRequestPriority,
} from "@/types/portal";
import { PermissionGuard } from "@/components/shared/permission-guard";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "OPEN", label: "Abertas" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "WAITING_CLIENT", label: "Aguardando Cliente" },
  { value: "RESOLVED", label: "Resolvidas" },
  { value: "CLOSED", label: "Encerradas" },
];

const PRIORITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Detail / messages
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceRequestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Update dialog
  const [updateDialog, setUpdateDialog] = useState<ServiceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updatePriority, setUpdatePriority] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [statusFilter, priorityFilter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const params: { status?: string; priority?: string } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      const res = await adminListServiceRequests(params);
      const items = res.items || (Array.isArray(res) ? res : []);
      setRequests(items);
    } catch {
      toast.error("Erro ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await adminGetServiceRequestStats();
      setStats(data);
    } catch {
      // silent
    }
  }

  async function toggleDetail(requestId: string) {
    if (expandedId === requestId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(requestId);
    setLoadingDetail(true);
    try {
      const d = await adminGetServiceRequestDetail(requestId);
      setDetail(d);
    } catch {
      toast.error("Erro ao carregar detalhes.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !expandedId) return;
    setSendingMessage(true);
    try {
      const msg = await adminAddServiceRequestMessage(expandedId, newMessage, isInternal);
      if (detail) {
        setDetail({ ...detail, messages: [...detail.messages, msg] });
      }
      setNewMessage("");
      setIsInternal(false);
      toast.success(isInternal ? "Nota interna adicionada" : "Resposta enviada");
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  }

  function openUpdateDialog(req: ServiceRequest) {
    setUpdateDialog(req);
    setUpdateStatus(req.status);
    setUpdatePriority(req.priority);
  }

  async function handleUpdate() {
    if (!updateDialog) return;
    setUpdating(true);
    try {
      const data: { status?: string; priority?: string } = {};
      if (updateStatus !== updateDialog.status) data.status = updateStatus;
      if (updatePriority !== updateDialog.priority) data.priority = updatePriority;
      if (Object.keys(data).length === 0) {
        setUpdateDialog(null);
        return;
      }
      const updated = await adminUpdateServiceRequest(updateDialog.id, data);
      setRequests((prev) =>
        prev.map((r) => (r.id === updateDialog.id ? { ...r, ...updated } : r))
      );
      if (detail && detail.id === updateDialog.id) {
        setDetail({ ...detail, ...updated });
      }
      toast.success("Solicitação atualizada");
      setUpdateDialog(null);
    } catch {
      toast.error("Erro ao atualizar solicitação.");
    } finally {
      setUpdating(false);
    }
  }

  const totalOpen = (stats.OPEN || 0) + (stats.IN_PROGRESS || 0) + (stats.WAITING_CLIENT || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Solicitações"
        description="Gerencie tickets e solicitações de clientes"
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Abertas", key: "OPEN", color: "text-blue-600" },
          { label: "Em Andamento", key: "IN_PROGRESS", color: "text-yellow-600" },
          { label: "Ag. Cliente", key: "WAITING_CLIENT", color: "text-orange-600" },
          { label: "Resolvidas", key: "RESOLVED", color: "text-green-600" },
          { label: "Encerradas", key: "CLOSED", color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.key}>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TicketCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const stCfg = REQUEST_STATUS_CONFIG[req.status] || REQUEST_STATUS_CONFIG.OPEN;
            const priCfg = REQUEST_PRIORITY_CONFIG[req.priority] || REQUEST_PRIORITY_CONFIG.MEDIUM;
            const isExpanded = expandedId === req.id;

            return (
              <Card key={req.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleDetail(req.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {req.ticket_number}
                        </span>
                        <Badge variant={stCfg.variant} className="text-xs">
                          {stCfg.label}
                        </Badge>
                        <Badge variant={priCfg.variant} className="text-xs">
                          {priCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {REQUEST_TYPE_LABELS[req.service_type]}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{req.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(req.created_at)}</span>
                        {req.assignee_name && (
                          <span>Responsável: {req.assignee_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUpdateDialog(req);
                        }}
                      >
                        Editar
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {loadingDetail ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : detail ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {detail.description}
                          </p>

                          {/* Messages */}
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {detail.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`rounded-lg p-3 text-sm ${
                                  msg.is_internal
                                    ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                                    : msg.author_type === "admin"
                                    ? "bg-primary/5 ml-4"
                                    : "bg-muted mr-4"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs">
                                      {msg.author_name}
                                    </span>
                                    {msg.is_internal && (
                                      <Badge variant="outline" className="text-[10px] text-yellow-600">
                                        <Lock className="h-2.5 w-2.5 mr-1" />
                                        Interno
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[10px]">
                                      {msg.author_type === "admin" ? "Admin" : "Cliente"}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* New message */}
                          <PermissionGuard permission="manage_service_requests">
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder="Escreva sua resposta..."
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSendMessage}
                                  disabled={sendingMessage || !newMessage.trim()}
                                >
                                  {sendingMessage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="internal"
                                  checked={isInternal}
                                  onCheckedChange={(v: boolean | "indeterminate") => setIsInternal(!!v)}
                                />
                                <label htmlFor="internal" className="text-xs text-muted-foreground cursor-pointer">
                                  Nota interna (não visível para o cliente)
                                </label>
                              </div>
                            </div>
                          </PermissionGuard>
                        </>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={(open) => { if (!open) setUpdateDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Solicitação</DialogTitle>
            <DialogDescription>
              {updateDialog?.ticket_number} — {updateDialog?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={updatePriority} onValueChange={setUpdatePriority}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.filter((p) => p.value !== "ALL").map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancelar</Button>
            <PermissionGuard permission="manage_service_requests">
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
