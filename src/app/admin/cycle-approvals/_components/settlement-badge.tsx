"use client";

import { AlertTriangle, CheckCircle2, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { CycleApprovalResponse } from "@/types";

/**
 * How much of the closing cycle is actually settled.
 *
 * The renewal is now raised ahead of the cycle's last due date, so "pending"
 * no longer implies "fully paid" -- the panel has to say which it is, because
 * that is exactly what decides between Aprovar and Renovar agora.
 */
export function SettlementBadge({ item }: { item: CycleApprovalResponse }) {
  const total = item.cycle_installments ?? 0;
  const settled = item.cycle_settled ?? 0;
  const unpaid = item.cycle_unpaid ?? 0;

  if (total === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (unpaid === 0) {
    return (
      <Badge variant="secondary" className="gap-1 border-0 bg-success/10 text-success">
        <CheckCircle2 className="h-3 w-3" />
        {settled}/{total} liquidadas
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1 border-0 bg-destructive/10 text-destructive"
      title={
        item.cycle_overdue_amount
          ? `${formatCurrency(item.cycle_overdue_amount)} vencido`
          : undefined
      }
    >
      <AlertTriangle className="h-3 w-3" />
      {settled}/{total} — {unpaid} em aberto
    </Badge>
  );
}

/** Marks the contract's last cycle, which is what starts escrituração. */
export function FinalCycleBadge() {
  return (
    <Badge className="gap-1 border-0 bg-amber-500 text-white">
      <FileSignature className="h-3 w-3" />
      ÚLTIMO CICLO
    </Badge>
  );
}
