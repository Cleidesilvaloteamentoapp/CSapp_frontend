"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Loader2, MessageSquare, Send, ChevronDown, ChevronUp, TicketCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import {
  listServiceRequests,
  createServiceRequest,
  getServiceRequestDetail,
  addServiceRequestMessage,
} from "@/services/portal";
import {
  REQUEST_STATUS_CONFIG,
  REQUEST_PRIORITY_CONFIG,
  REQUEST_TYPE_LABELS,
} from "@/types/portal";
import type {
  ServiceRequest,
  ServiceRequestCreate,
  ServiceRequestDetail,
  ServiceRequestType,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "@/types/portal";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "OPEN", label: "Abertas" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "WAITING_CLIENT", label: "Aguardando Você" },
  { value: "RESOLVED", label: "Resolvidas" },
  { value: "CLOSED", label: "Encerradas" },
];

const TYPE_OPTIONS: Array<{ value: ServiceRequestType; label: string }> = [
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "SUPORTE", label: "Suporte" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "DOCUMENTACAO", label: "Documentação" },
  { value: "OUTROS", label: "Outros" },
];

const PRIORITY_OPTIONS: Array<{ value: ServiceRequestPriority; label: string }> = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

export default function PortalServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState<ServiceRequestType>("SUPORTE");
  const [formSubject, setFormSubject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState<ServiceRequestPriority>("MEDIUM");

  // Detail / messages
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceRequestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await listServiceRequests(params);
      setRequests(res.items || []);
    } catch {
      toast.error("Erro ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formSubject.trim() || !formDesc.trim()) return;
    setSaving(true);
    try {
      const data: ServiceRequestCreate = {
        service_type: formType,
        subject: formSubject,
        description: formDesc,
        priority: formPriority,
      };
      const created = await createServiceRequest(data);
      setRequests((prev) => [created, ...prev]);
      toast.success(`Solicitação ${created.ticket_number} criada`);
      resetCreateDialog();
    } catch {
      toast.error("Erro ao criar solicitação.");
    } finally {
      setSaving(false);
    }
  }

  function resetCreateDialog() {
    setCreateOpen(false);
    setFormType("SUPORTE");
    setFormSubject("");
    setFormDesc("");
    setFormPriority("MEDIUM");
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
      const d = await getServiceRequestDetail(requestId);
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
      const msg = await addServiceRequestMessage(expandedId, newMessage);
      if (detail) {
        setDetail({ ...detail, messages: [...detail.messages, msg] });
      }
      setNewMessage("");
      toast.success("Mensagem enviada");
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  }

  const canSendMessage = (status: ServiceRequestStatus) =>
    status !== "CLOSED" && status !== "RESOLVED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Solicitações"
          description="Abra e acompanhe suas solicitações de suporte"
        />
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filtrar status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {req.ticket_number}
                        </span>
                        <Badge variant={stCfg.variant} className="text-xs">
                          {stCfg.label}
                        </Badge>
                        <Badge variant={priCfg.variant} className="text-xs">
                          {priCfg.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{req.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{REQUEST_TYPE_LABELS[req.service_type]}</span>
                        <span>{formatDate(req.created_at)}</span>
                        {req.assignee_name && (
                          <span>Responsável: {req.assignee_name}</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Expanded detail with messages */}
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

                          {/* Messages thread */}
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {detail.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`rounded-lg p-3 text-sm ${
                                  msg.author_type === "client"
                                    ? "bg-primary/5 ml-4"
                                    : "bg-muted mr-4"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-xs">
                                    {msg.author_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* New message input */}
                          {canSendMessage(detail.status) && (
                            <div className="flex gap-2">
                              <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escreva sua mensagem..."
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
                          )}
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetCreateDialog(); else setCreateOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
            <DialogDescription>Preencha os dados para abrir uma solicitação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ServiceRequestType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as ServiceRequestPriority)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assunto *</label>
              <Input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="Resumo da solicitação"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Descreva detalhadamente sua solicitação..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetCreateDialog}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formSubject.trim() || !formDesc.trim()}
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                ) : (
                  "Enviar Solicitação"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
