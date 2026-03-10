"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell, BellOff, CheckCheck, Loader2,
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
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/portal";
import { NOTIFICATION_TYPE_LABELS } from "@/types/portal";
import type { Notification, NotificationType } from "@/types/portal";
import { useNotifications } from "@/hooks/use-notifications";

const READ_FILTER_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "UNREAD", label: "Não lidas" },
  { value: "READ", label: "Lidas" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "BOLETO_EMITIDO", label: "Boleto Emitido" },
  { value: "BOLETO_VENCIDO", label: "Boleto Vencido" },
  { value: "PAGAMENTO_CONFIRMADO", label: "Pagamento Confirmado" },
  { value: "DOCUMENTO_APROVADO", label: "Documento Aprovado" },
  { value: "DOCUMENTO_REJEITADO", label: "Documento Rejeitado" },
  { value: "SOLICITACAO_ATUALIZADA", label: "Solicitação Atualizada" },
  { value: "GERAL", label: "Geral" },
];

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [markingAll, setMarkingAll] = useState(false);
  const { refresh: refreshUnreadCount } = useNotifications();

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
      const data = await listNotifications(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notifId: string) {
    try {
      const updated = await markNotificationRead(notifId);
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
      await markAllNotificationsRead();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notificações"
          description="Acompanhe avisos e atualizações"
        />
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
      </div>

      <div className="flex gap-3">
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Leitura" />
          </SelectTrigger>
          <SelectContent>
            {READ_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`hover:shadow-sm transition-shadow cursor-pointer ${
                !notif.is_read ? "border-l-4 border-l-primary" : ""
              }`}
              onClick={() => {
                if (!notif.is_read) handleMarkRead(notif.id);
              }}
            >
              <CardContent className="flex items-start justify-between py-3 px-4">
                <div className="flex items-start gap-3">
                  <Bell
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      notif.is_read ? "text-muted-foreground" : "text-primary"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${notif.is_read ? "text-muted-foreground" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {NOTIFICATION_TYPE_LABELS[notif.type] || notif.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDate(notif.created_at)}
                    </p>
                  </div>
                </div>
                {!notif.is_read && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
