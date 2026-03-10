"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { listPortalBoletos, downloadPortalBoletoPdf, triggerDownload } from "@/services/portal";
import { BOLETO_STATUS_CONFIG } from "@/types/portal";
import type { PortalBoleto } from "@/types/portal";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "NORMAL", label: "Normal" },
  { value: "LIQUIDADO", label: "Liquidado" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "NEGATIVADO", label: "Negativado" },
  { value: "PENDING_APPROVAL", label: "Pendente" },
];

export default function PortalBoletosPage() {
  const [boletos, setBoletos] = useState<PortalBoleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadBoletos();
  }, [statusFilter]);

  async function loadBoletos() {
    setLoading(true);
    try {
      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await listPortalBoletos(status);
      setBoletos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Não foi possível carregar seus boletos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(boleto: PortalBoleto) {
    setDownloadingId(boleto.nosso_numero);
    try {
      const blob = await downloadPortalBoletoPdf(boleto.nosso_numero);
      triggerDownload(blob, `boleto_${boleto.nosso_numero}.pdf`);
      toast.success("PDF baixado com sucesso");
    } catch {
      toast.error("Erro ao baixar PDF do boleto");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Meus Boletos"
          description="Visualize e baixe seus boletos"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
      ) : boletos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum boleto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {boletos.map((boleto) => {
            const cfg = BOLETO_STATUS_CONFIG[boleto.status] || BOLETO_STATUS_CONFIG.NORMAL;
            const isDownloading = downloadingId === boleto.nosso_numero;

            return (
              <Card
                key={boleto.nosso_numero}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        Boleto {boleto.nosso_numero}
                      </p>
                      <Badge variant={cfg.variant} className="text-xs">
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {formatDate(boleto.data_vencimento)}
                    </p>
                    {boleto.seu_numero && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {boleto.seu_numero}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">
                      {formatCurrency(boleto.valor)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(boleto)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
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
