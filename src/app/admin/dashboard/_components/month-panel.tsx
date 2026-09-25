"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/format";
import type { FinancialOverview } from "@/types";

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long" });

/** One figure of the month, optionally linking to the rows behind it. */
function Figure({
  label,
  hint,
  amount,
  count,
  href,
  tone = "default",
}: {
  label: string;
  hint: string;
  amount: string;
  count: number;
  href?: string;
  tone?: "default" | "success" | "danger" | "muted";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];

  const body = (
    <div className="rounded-lg border p-3 transition-colors hover:border-primary/40">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-bold leading-tight ${toneClass}`}>
        {formatCurrency(amount)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {count} parcela{count === 1 ? "" : "s"} · {hint}
      </p>
      {href && (
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
          Ver <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

/**
 * The month, not the lifetime.
 *
 * The financial summary only ever showed cumulative "a receber", which cannot
 * answer whether this month is on track. This breaks the month into its target,
 * the cash that actually landed, what is still open, and what is already
 * scheduled for next month.
 */
export function MonthPanel({
  financial,
  basePath = "/admin",
}: {
  financial: FinancialOverview | null;
  basePath?: string;
}) {
  if (!financial) return null;

  const expected = toNumber(financial.month_expected_amount);
  const received = toNumber(financial.month_received_amount);
  const open = toNumber(financial.month_open_amount);
  const overdue = toNumber(financial.month_overdue_amount);
  const next = toNumber(financial.next_month_expected_amount);

  // Realization is cash-in against the month's target. It can pass 100% when
  // late payments from earlier months land, which is worth seeing, not hiding.
  const pct = expected > 0 ? Math.round((received / expected) * 100) : 0;
  const now = new Date();
  const monthName = MONTH_LABEL.format(now);
  const nextMonthName = MONTH_LABEL.format(
    new Date(now.getFullYear(), now.getMonth() + 1, 1)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{monthName}</span> — como está o mês
        </CardTitle>
        <CardDescription>
          Quanto era esperado, quanto entrou e quanto ainda falta. Clique para ver
          as parcelas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Realizado do previsto</span>
            <span className="font-semibold">
              {pct}% · {formatCurrency(received)} de {formatCurrency(expected)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90 ? "bg-success" : pct >= 60 ? "bg-primary" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label="Previsto no mês"
            hint="vencem neste mês"
            amount={financial.month_expected_amount}
            count={financial.month_expected_count}
            href={`${basePath}/financial?status=all`}
          />
          <Figure
            label="Recebido no mês"
            hint="entrou em caixa"
            amount={financial.month_received_amount}
            count={financial.month_received_count}
            tone="success"
            href={`${basePath}/financial?status=paid`}
          />
          <Figure
            label="A vencer no mês"
            hint="ainda dentro do prazo"
            amount={financial.month_open_amount}
            count={financial.month_open_count}
            href={`${basePath}/financial?status=pending`}
          />
          <Figure
            label="Vencido no mês"
            hint="precisa de cobrança"
            amount={financial.month_overdue_amount}
            count={financial.month_overdue_count}
            tone={overdue > 0 ? "danger" : "muted"}
            href={`${basePath}/financial?status=overdue`}
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Projeção para <span className="capitalize">{nextMonthName}</span>:{" "}
              {formatCurrency(next)}
            </p>
            <p className="text-xs text-muted-foreground">
              {financial.next_month_expected_count} parcela
              {financial.next_month_expected_count === 1 ? "" : "s"} já emitida
              {financial.next_month_expected_count === 1 ? "" : "s"} com vencimento no
              mês que vem.
              {next === 0 &&
                " Nenhuma parcela emitida ainda — verifique as renovações de ciclo pendentes."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
