"use client";

import { CheckCircle2, Circle, FileText, Home, Receipt, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryItem {
  label: string;
  value: string;
  completed: boolean;
  icon?: React.ReactNode;
}

interface SummarySidebarProps {
  items: SummaryItem[];
  currentStep: number;
}

export function SummarySidebar({ items, currentStep }: SummarySidebarProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Resumo do Cadastro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 rounded-md p-2 text-sm",
              i === currentStep && "bg-muted/80 font-medium",
              i < currentStep && "text-muted-foreground"
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="truncate text-sm">{item.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function getSummaryItems(
  state: {
    client: { full_name?: string } | null;
    clientSelectionMode: string | null;
    lot: { block?: string | null; lot_number?: string } | null;
    createdLotId: string | null;
    clientLot: { id?: string } | null;
    boletoMode: string | null;
    boletoResult: { nosso_numero?: string; batch_id?: string } | null;
    documents: unknown[];
  }
) {
  const clientName = state.client?.full_name ?? "—";
  const lotLabel = state.lot
    ? `${state.lot.block ? `${state.lot.block}-` : ""}${state.lot.lot_number}`
    : state.createdLotId
      ? "Lote criado"
      : "—";
  const boletoLabel =
    state.boletoMode === "SKIP"
      ? "Pulado"
      : state.boletoResult
        ? "Gerado"
        : "—";

  return [
    {
      label: "Cliente",
      value: state.clientSelectionMode === "NEW" ? `${clientName} (Novo)` : clientName,
      completed: !!state.client,
      icon: <User className="h-4 w-4" />,
    },
    {
      label: "Imóvel / Lote",
      value: lotLabel,
      completed: !!state.clientLot || !!state.createdLotId,
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: "Boletos",
      value: boletoLabel,
      completed: state.boletoMode !== null,
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      label: "Documentos",
      value: `${state.documents.length} enviado${state.documents.length !== 1 ? "s" : ""}`,
      completed: state.documents.length > 0,
      icon: <FileText className="h-4 w-4" />,
    },
  ];
}
