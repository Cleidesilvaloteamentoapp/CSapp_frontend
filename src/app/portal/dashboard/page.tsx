"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Barcode, MapPin, AlertTriangle, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${user?.full_name?.split(" ")[0] || "Cliente"}`}
        description="Acompanhe seus lotes, boletos e serviços"
      />

      {loading ? (
        <StatsCardsSkeleton count={4} />
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
