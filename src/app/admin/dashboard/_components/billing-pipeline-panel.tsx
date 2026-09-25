"use client";

import Link from "next/link";
import { AlertTriangle, Barcode, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { BillingPipeline } from "@/types";

/** Short relative time, e.g. "há 5 min". */
function timeAgo(iso: string | null): string {
  if (!iso) return "nunca";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const min = Math.floor((Date.now() - then) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

const STATUS_LABELS: Record<string, string> = {
  NORMAL: "Em aberto",
  LIQUIDADO: "Pagos",
  VENCIDO: "Vencidos",
  CANCELADO: "Cancelados",
  NEGATIVADO: "Negativados",
  PENDING_APPROVAL: "Aguardando aprovação",
  BAIXA_MANUAL: "Baixa manual",
};

/**
 * Health of the billing chain.
 *
 * `invoices_without_boleto` leads because it is the failure that hides itself:
 * an installment with no boleto is never paid, and an unpaid installment holds
 * its contract's whole renewal cycle shut.
 */
export function BillingPipelinePanel({
  pipeline,
  basePath = "/admin",
}: {
  pipeline: BillingPipeline | null;
  basePath?: string;
}) {
  if (!pipeline) return null;

  const gap = pipeline.invoices_without_boleto;
  const staleSync =
    pipeline.last_sicredi_sync === null ||
    Date.now() - new Date(pipeline.last_sicredi_sync).getTime() > 24 * 3600 * 1000;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Barcode className="h-4 w-4 text-muted-foreground" />
          Cobrança — do contrato ao banco
        </CardTitle>
        <CardDescription>
          Acompanhe se toda parcela virou boleto e se o banco está respondendo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link
          href={`${basePath}/financial?status=PENDING&without_boleto=1`}
          className="block"
        >
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 ${
              gap > 0 ? "border-destructive/40 bg-destructive/5" : ""
            }`}
          >
            {gap > 0 ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${gap > 0 ? "text-destructive" : ""}`}>
                {gap} parcela(s) sem boleto
              </p>
              <p className="text-xs text-muted-foreground">
                {gap > 0
                  ? `${formatCurrency(pipeline.invoices_without_boleto_amount)} que o cliente não tem como pagar — e que travam a renovação do contrato.`
                  : "Toda parcela em aberto tem boleto emitido."}
              </p>
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap gap-2">
          {pipeline.boletos_by_status.map((s) => (
            <Badge key={s.status} variant="secondary" className="gap-1">
              {STATUS_LABELS[s.status] ?? s.status}: <strong>{s.count}</strong>
            </Badge>
          ))}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lotes em andamento:</span>
            <strong>{pipeline.batches_in_progress}</strong>
          </div>
          <div className="flex items-center gap-2">
            <XCircle
              className={`h-4 w-4 ${
                pipeline.batches_failed_recently > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            />
            <span className="text-muted-foreground">Lotes falhos (7d):</span>
            <strong
              className={pipeline.batches_failed_recently > 0 ? "text-destructive" : ""}
            >
              {pipeline.batches_failed_recently}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <Barcode
              className={`h-4 w-4 ${staleSync ? "text-amber-600" : "text-muted-foreground"}`}
            />
            <span className="text-muted-foreground">Última sync Sicredi:</span>
            <strong className={staleSync ? "text-amber-600" : ""}>
              {timeAgo(pipeline.last_sicredi_sync)}
            </strong>
          </div>
        </div>

        {pipeline.sicredi_errors_24h > 0 && (
          <Link href={`${basePath}/sicredi-events`} className="block">
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 transition-colors hover:border-amber-400">
              <strong>{pipeline.sicredi_errors_24h}</strong> erro(s) de integração nas
              últimas 24 h — ver auditoria Sicredi.
            </p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
