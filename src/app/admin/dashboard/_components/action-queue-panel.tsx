"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSignature,
  FileText,
  Handshake,
  RefreshCw,
  TicketCheck,
  Ban,
  FastForward,
  ArrowLeftRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionQueue, ActionQueueItem } from "@/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cycle_approvals: RefreshCw,
  final_cycles: FileSignature,
  transfers: ArrowLeftRight,
  rescissions: Ban,
  early_payoff: FastForward,
  renegotiations: Handshake,
  documents: FileText,
  service_requests: TicketCheck,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/5 hover:border-destructive",
  warning: "border-amber-300 bg-amber-50/60 hover:border-amber-400",
  info: "hover:border-primary/40",
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-amber-600",
  info: "text-foreground",
};

function QueueCard({ item, basePath }: { item: ActionQueueItem; basePath: string }) {
  const Icon = ICONS[item.key] ?? CheckCircle2;
  // The backend speaks in /admin paths; staff browse the same screens under /staff.
  const href = item.href.replace(/^\/admin/, basePath);

  return (
    <Link href={href} className="block transition-transform hover:scale-[1.01]">
      <Card className={`h-full cursor-pointer transition-colors ${SEVERITY_STYLES[item.severity]}`}>
        <CardContent className="flex gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className={`h-5 w-5 ${SEVERITY_TEXT[item.severity]}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold leading-none ${SEVERITY_TEXT[item.severity]}`}>
                {item.count}
              </span>
              <span className="truncate text-sm font-medium">{item.label}</span>
            </div>
            {/* The instruction is the point: a number with no next step is noise. */}
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.hint}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              Abrir <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * "Precisa da sua decisão": everything waiting on a human, each tile linking to
 * the screen already filtered to those rows.
 */
export function ActionQueuePanel({
  queue,
  basePath = "/admin",
}: {
  queue: ActionQueue | null;
  basePath?: string;
}) {
  if (!queue) return null;

  const pending = queue.items.filter((i) => i.count > 0);

  if (pending.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="font-semibold text-success">Nada aguardando decisão</p>
            <p className="text-sm text-muted-foreground">
              Renovações, transferências, distratos e documentos estão em dia.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const critical = pending.some((i) => i.severity === "critical");

  return (
    <Card className={critical ? "border-destructive/30" : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {critical && <AlertTriangle className="h-4 w-4 text-destructive" />}
          Precisa da sua decisão
        </CardTitle>
        <CardDescription>
          {queue.total} item(ns) parado(s) esperando uma ação sua. Clique em qualquer
          cartão para abrir a tela já filtrada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pending.map((item) => (
            <QueueCard key={item.key} item={item} basePath={basePath} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
