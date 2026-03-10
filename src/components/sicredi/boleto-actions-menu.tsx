"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Download,
  Ban,
  Calendar,
  Percent,
  DollarSign,
  Hash,
  AlertTriangle,
  ShieldOff,
  UserPlus,
} from "lucide-react";
import type { Boleto } from "@/types/sicredi";

type ActionType =
  | "view"
  | "pdf"
  | "cancel"
  | "vencimento"
  | "juros"
  | "desconto"
  | "abatimento"
  | "cancelar_abatimento"
  | "seu_numero"
  | "negativar"
  | "sustar_negativacao"
  | "link_client";

interface BoletoActionsMenuProps {
  boleto: Boleto;
  onAction: (action: ActionType, boleto: Boleto) => void;
  disabled?: boolean;
}

export function BoletoActionsMenu({
  boleto,
  onAction,
  disabled,
}: BoletoActionsMenuProps) {
  const status = boleto.status;
  const isEditable = status !== "CANCELADO" && status !== "LIQUIDADO";
  const isNegativado = status === "NEGATIVADO";
  const isVencido = status === "VENCIDO";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onAction("view", boleto)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("pdf", boleto)}>
          <Download className="mr-2 h-4 w-4" />
          Baixar PDF
        </DropdownMenuItem>

        {!boleto.client_id && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction("link_client", boleto)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Vincular Cliente
            </DropdownMenuItem>
          </>
        )}

        {isEditable && !isNegativado && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction("vencimento", boleto)}>
              <Calendar className="mr-2 h-4 w-4" />
              Alterar Vencimento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("juros", boleto)}>
              <Percent className="mr-2 h-4 w-4" />
              Alterar Juros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("desconto", boleto)}>
              <Percent className="mr-2 h-4 w-4" />
              Alterar Desconto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("abatimento", boleto)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Conceder Abatimento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("cancelar_abatimento", boleto)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Cancelar Abatimento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("seu_numero", boleto)}>
              <Hash className="mr-2 h-4 w-4" />
              Alterar Seu Número
            </DropdownMenuItem>
          </>
        )}

        {isVencido && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction("negativar", boleto)}
              className="text-red-600 focus:text-red-600"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Incluir Negativação
            </DropdownMenuItem>
          </>
        )}

        {isNegativado && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction("sustar_negativacao", boleto)}
              className="text-orange-600 focus:text-orange-600"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Sustar Negativação + Baixar
            </DropdownMenuItem>
          </>
        )}

        {isEditable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction("cancel", boleto)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Dar Baixa (Cancelar)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { ActionType };
