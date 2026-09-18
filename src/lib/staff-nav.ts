import {
  LayoutDashboard,
  Users,
  MapPin,
  DollarSign,
  Wrench,
  Barcode,
  FolderOpen,
  TicketCheck,
  TrendingUp,
  CheckCircle,
  ArrowLeftRight,
  FastForward,
  FileSpreadsheet,
  Cog,
  MessageSquare,
  RefreshCw,
  FileX,
  FileText,
} from "lucide-react";
import type { StaffPermissions } from "@/types";

export type StaffNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: keyof StaffPermissions | null;
  separator?: boolean;
};

/**
 * Single source of truth for staff navigation: the sidebar renders it and the
 * landing redirect picks from it, so a staff member can never be sent to a
 * route that the sidebar would not have shown them.
 */
export const STAFF_NAV_ITEMS: StaffNavItem[] = [
  { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view_financial" },
  { href: "/staff/clients", label: "Clientes", icon: Users, permission: "view_clients" },
  { href: "/staff/developments", label: "Imóveis", icon: MapPin, permission: "view_lots" },
  { href: "/staff/financial", label: "Financeiro", icon: DollarSign, permission: "view_financial", separator: true },
  { href: "/staff/financial-settings", label: "Config. Financeiras", icon: Cog, permission: "view_financial_settings" },
  { href: "/staff/economic-indices", label: "Índices Econômicos", icon: TrendingUp, permission: "view_financial_settings" },
  { href: "/staff/cycle-approvals", label: "Aprovação de Ciclos", icon: CheckCircle, permission: "manage_financial" },
  { href: "/staff/transfers", label: "Transferências", icon: ArrowLeftRight, permission: "manage_clients" },
  { href: "/staff/early-payoff-requests", label: "Antecipações", icon: FastForward, permission: "manage_financial" },
  { href: "/staff/bank-statements", label: "Extratos Bancários", icon: FileSpreadsheet, permission: "view_financial" },
  { href: "/staff/renegotiations", label: "Renegociações", icon: RefreshCw, permission: "view_renegotiations" },
  { href: "/staff/rescissions", label: "Distratos", icon: FileX, permission: "view_rescissions" },
  { href: "/staff/reports", label: "Relatórios", icon: FileText, permission: "view_reports" },
  { href: "/staff/services", label: "Serviços", icon: Wrench, permission: "view_service_requests", separator: true },
  { href: "/staff/sicredi/boletos", label: "Boletos", icon: Barcode, permission: "manage_sicredi" },
  { href: "/staff/documents", label: "Documentos", icon: FolderOpen, permission: "view_documents" },
  { href: "/staff/service-requests", label: "Solicitações", icon: TicketCheck, permission: "view_service_requests" },
  { href: "/staff/settings/whatsapp", label: "WhatsApp", icon: MessageSquare, permission: "manage_whatsapp", separator: true },
];

/**
 * First route this staff member is actually allowed to open, or null when no
 * permission grants any route at all.
 */
export function getFirstAllowedStaffRoute(
  can: (perm: keyof StaffPermissions) => boolean
): string | null {
  const item = STAFF_NAV_ITEMS.find(
    (nav) => nav.permission === null || can(nav.permission)
  );
  return item?.href ?? null;
}
