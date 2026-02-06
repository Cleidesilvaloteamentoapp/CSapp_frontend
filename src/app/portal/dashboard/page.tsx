"use client";

import { useEffect, useState } from "react";
import { FileText, Wrench, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ClientDashboard } from "@/types";

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ClientDashboard>("/client/dashboard")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.full_name?.split(" ")[0] || "Cliente"}`}
        description="Acompanhe seus lotes, faturas e serviços"
      />

      {loading ? (
        <StatsCardsSkeleton count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Meus Lotes</CardTitle>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.lots_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.pending_invoices ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em Atraso</CardTitle>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{data?.overdue_invoices ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Serviços Ativos</CardTitle>
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.active_services ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          {data?.next_invoices && data.next_invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximas Faturas</CardTitle>
                <CardDescription>Vencimentos mais próximos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.next_invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">Parcela {inv.installment_number}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {formatDate(inv.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                        <Badge variant={inv.status === "overdue" ? "destructive" : "outline"} className="mt-1 text-xs">
                          {inv.status === "overdue" ? "Vencida" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
