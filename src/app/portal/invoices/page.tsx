"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceResponse } from "@/types";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Vencida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<InvoiceResponse[]>("/client/invoices")
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Minhas Faturas" description="Acompanhe suas parcelas e pagamentos" />

      {loading ? (
        <TableSkeleton />
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const st = STATUS[inv.status] || STATUS.pending;
            return (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-sm">Parcela {inv.installment_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vencimento: {formatDate(inv.due_date)}
                    </p>
                    {inv.paid_at && (
                      <p className="text-xs text-success mt-0.5">Pago em: {formatDate(inv.paid_at)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                    <Badge variant={st.variant} className="mt-1 text-xs">{st.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
