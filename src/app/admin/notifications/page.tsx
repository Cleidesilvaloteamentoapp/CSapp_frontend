"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell, CheckCheck, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/format";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/services/admin";
import { ADMIN_NOTIFICATION_TYPE_LABELS } from "@/types";
import type { AdminNotification, AdminNotificationType } from "@/types";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";

const READ_FILTER_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "UNREAD", label: "Não lidas" },
  { value: "READ", label: "Lidas" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "CICLO_PENDENTE", label: "Ciclo Pendente" },
  { value: "TRANSFERENCIA_SOLICITADA", label: "Transferência Solicitada" },
  { value: "ANTECIPACAO_SOLICITADA", label: "Antecipação Solicitada" },
  { value: "DOCUMENTO_PENDENTE", label: "Documento Pendente" },
  { value: "BOLETO_VENCIDO", label: "Boleto Vencido" },
  { value: "GERAL", label: "Geral" },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [markingAll, setMarkingAll] = useState(false);
  const { refresh: refreshUnreadCount } = useAdminNotifications();

  useEffect(() => {
    loadNotifications();
  }, [readFilter, typeFilter]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const params: { is_read?: boolean; notification_type?: string } = {};
      if (readFilter === "UNREAD") params.is_read = false;
      if (readFilter === "READ") params.is_read = true;
      if (typeFilter !== "ALL") params.notification_type = typeFilter;
      const data = await listAdminNotifications(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notifId: string) {
    try {
      const updated = await markAdminNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      refreshUnreadCount();
    } catch {
      toast.error("Erro ao marcar como lida.");
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refreshUnreadCount();
      toast.success("Todas as notificações marcadas como lidas");
    } catch {
      toast.error("Erro ao marcar todas como lidas.");
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  function getTypeLabel(type: AdminNotificationType) {
    return ADMIN_NOTIFICATION_TYPE_LABELS[type] || type;
  }

  function getTypeBadgeVariant(type: AdminNotificationType): "default" | "secondary" | "destructive" | "outline" {
    switch (type) {
      case "CICLO_PENDENTE":
        return "default";
      case "TRANSFERENCIA_SOLICITADA":
        return "secondary";
      case "ANTECIPACAO_SOLICITADA":
        return "outline";
      case "DOCUMENTO_PENDENTE":
        return "outline";
      case "BOLETO_VENCIDO":
        return "destructive";
      default:
        return "outline";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notificações" description="Acompanhe as notificações do sistema">
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {READ_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={notif.is_read ? "opacity-75" : "border-l-4 border-l-primary"}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getTypeBadgeVariant(notif.type)}>
                        {getTypeLabel(notif.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{notif.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                    {/* Data extras para CICLO_PENDENTE */}
                    {notif.type === "CICLO_PENDENTE" && notif.data && (
                      <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
                        <p className="font-medium">Dados do Ciclo:</p>
                        <p>Ciclo Atual: {notif.data.current_cycle as number}</p>
                        <p>Próximo Ciclo: {notif.data.next_cycle as number}</p>
                        <p>Parcelas Restantes: {notif.data.remaining_installments as number}</p>
                      </div>
                    )}
                  </div>
                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notif.id)}
                      className="shrink-0"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Marcar lida
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
