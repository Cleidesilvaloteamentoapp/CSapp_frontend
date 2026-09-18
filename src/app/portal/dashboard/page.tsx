"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Barcode, MapPin, AlertTriangle, CalendarClock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCardsSkeleton } from "@/components/shared/loading-skeleton";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDashboardSummary } from "@/services/portal";
import type { DashboardSummary } from "@/types/portal";

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // A failure must never fall through to zeros: a client with an overdue
  // installment would read "0 boletos vencidos" and assume they owe nothing.
  const load = useCallback(async () => {
    try {
      setData(await getDashboardSummary());
      setError(false);
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.full_name?.split(" ")[0] || "Cliente"}`}
        description="Acompanhe seus lotes, boletos e serviços"
      />

      {loading ? (
        <StatsCardsSkeleton count={4} />
      ) : error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Não foi possível carregar seu resumo</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Os valores abaixo não puderam ser consultados agora. Isto não
                significa que você não tem lotes ou boletos em aberto &mdash; tente
                novamente ou consulte a página de boletos.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={retry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" asChild>
                <Link href="/portal/boletos">Ver meus boletos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/portal/boletos" className="transition-transform hover:scale-[1.02]">
              <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Meus Lotes</CardTitle>
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.total_lots ?? 0}</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/boletos" className="transition-transform hover:scale-[1.02]">
              <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Pendentes</CardTitle>
                  <Barcode className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.pending_invoices ?? 0}</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/boletos" className="transition-transform hover:scale-[1.02]">
              <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Vencidos</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{data?.overdue_invoices ?? 0}</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/portal/boletos" className="transition-transform hover:scale-[1.02]">
              <Card className="h-full cursor-pointer hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Próximo Vencimento</CardTitle>
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {data?.next_due_date ? (
                    <>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.next_due_amount ?? 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(data.next_due_date)}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
