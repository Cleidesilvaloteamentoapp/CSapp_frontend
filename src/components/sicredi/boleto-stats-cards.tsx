"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BoletoStats, BoletoSituacao } from "@/types/sicredi";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Hourglass,
} from "lucide-react";

interface BoletoStatsCardsProps {
  stats: BoletoStats | null;
  loading: boolean;
  activeFilter: BoletoSituacao | null;
  onFilterClick: (status: BoletoSituacao | null) => void;
}

const STATUS_CARDS: {
  status: BoletoSituacao;
  label: string;
  icon: typeof FileText;
  bgActive: string;
  bgHover: string;
  textColor: string;
  iconColor: string;
}[] = [
  {
    status: "NORMAL",
    label: "Em Aberto",
    icon: Clock,
    bgActive: "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700",
    bgHover: "hover:bg-green-50/50 dark:hover:bg-green-950/50",
    textColor: "text-green-700 dark:text-green-400",
    iconColor: "text-green-500",
  },
  {
    status: "LIQUIDADO",
    label: "Liquidados",
    icon: CheckCircle2,
    bgActive: "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700",
    bgHover: "hover:bg-blue-50/50 dark:hover:bg-blue-950/50",
    textColor: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500",
  },
  {
    status: "VENCIDO",
    label: "Vencidos",
    icon: AlertTriangle,
    bgActive: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
    bgHover: "hover:bg-yellow-50/50 dark:hover:bg-yellow-950/50",
    textColor: "text-yellow-700 dark:text-yellow-400",
    iconColor: "text-yellow-500",
  },
  {
    status: "CANCELADO",
    label: "Cancelados",
    icon: XCircle,
    bgActive: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
    bgHover: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    textColor: "text-gray-600 dark:text-gray-400",
    iconColor: "text-gray-400",
  },
  {
    status: "NEGATIVADO",
    label: "Negativados",
    icon: AlertTriangle,
    bgActive: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700",
    bgHover: "hover:bg-red-50/50 dark:hover:bg-red-950/50",
    textColor: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500",
  },
  {
    status: "PENDING_APPROVAL",
    label: "Aguardando Aprovação",
    icon: Hourglass,
    bgActive: "bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700",
    bgHover: "hover:bg-amber-50/50 dark:hover:bg-amber-950/50",
    textColor: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
];

export function BoletoStatsCards({
  stats,
  loading,
  activeFilter,
  onFilterClick,
}: BoletoStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const getStatusData = (status: BoletoSituacao) => {
    const found = stats.by_status.find((s) => s.status === status);
    return { count: found?.count ?? 0, total_value: found?.total_value ?? 0 };
  };

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {STATUS_CARDS.map((card) => {
        const data = getStatusData(card.status);
        const isActive = activeFilter === card.status;
        const Icon = card.icon;

        return (
          <Card
            key={card.status}
            className={cn(
              "cursor-pointer transition-all duration-200 border-2",
              isActive ? card.bgActive : `border-transparent ${card.bgHover}`
            )}
            onClick={() => onFilterClick(isActive ? null : card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </span>
                <Icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
              <p className={cn("text-2xl font-bold", card.textColor)}>
                {data.count}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(data.total_value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
