"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  downloadClientBoletoPdf,
  triggerPdfDownload,
} from "@/services/sicredi";
import type { BoletoDetails } from "@/types/sicredi";

const SITUACAO_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NORMAL: { label: "Em Aberto", variant: "outline" },
  EM_ABERTO: { label: "Em Aberto", variant: "outline" },
  LIQUIDADO: { label: "Pago", variant: "default" },
  VENCIDO: { label: "Vencido", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "secondary" },
};

export default function PortalBoletosPage() {
  const [boletos, setBoletos] = useState<BoletoDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<BoletoDetails[]>("/client/boletos")
      .then(setBoletos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDownloadPdf(boleto: BoletoDetails) {
    setDownloadingId(boleto.nosso_numero);
    try {
      const blob = await downloadClientBoletoPdf(boleto.nosso_numero);
      triggerPdfDownload(blob, `boleto_${boleto.nosso_numero}.pdf`);
      toast.success("PDF baixado com sucesso");
    } catch {
      toast.error("Erro ao baixar PDF do boleto");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Boletos"
        description="Visualize e baixe seus boletos"
      />

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
            const sit =
              SITUACAO_BADGE[boleto.situacao] || SITUACAO_BADGE.NORMAL;
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
                      <Badge variant={sit.variant} className="text-xs">
                        {sit.label}
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
