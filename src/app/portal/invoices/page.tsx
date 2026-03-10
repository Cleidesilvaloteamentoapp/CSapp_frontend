"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { listPortalInvoices, getInvoicePdfUrl } from "@/services/portal";
import { INVOICE_STATUS_CONFIG } from "@/types/portal";
import type { PortalInvoice, PortalInvoiceStatus } from "@/types/portal";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PAID", label: "Pagas" },
  { value: "OVERDUE", label: "Vencidas" },
  { value: "CANCELLED", label: "Canceladas" },
];

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await listPortalInvoices(status);
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar faturas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Minhas Faturas" description="Acompanhe suas parcelas e pagamentos" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const st = INVOICE_STATUS_CONFIG[inv.status] || INVOICE_STATUS_CONFIG.PENDING;
            const showPayButton = inv.payment_url && (inv.status === "PENDING" || inv.status === "OVERDUE");
            return (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Parcela {inv.installment_number}</p>
                      <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vencimento: {formatDate(inv.due_date)}
                    </p>
                    {inv.paid_at && (
                      <p className="text-xs text-green-600 mt-0.5">Pago em: {formatDate(inv.paid_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                    </div>
                    {showPayButton && (
                      <Button size="sm" asChild>
                        <a href={inv.payment_url!} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Pagar
                        </a>
                      </Button>
                    )}
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
