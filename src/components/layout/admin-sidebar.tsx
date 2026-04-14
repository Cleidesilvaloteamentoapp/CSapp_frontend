"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  DollarSign,
  Wrench,
  Barcode,
  ListChecks,
  Settings,
  Building2,
  LogOut,
  ChevronLeft,
  FolderOpen,
  TicketCheck,
  TrendingUp,
  CheckCircle,
  ArrowLeftRight,
  FastForward,
  FileSpreadsheet,
  Cog,
  MessageSquare,
  Bell,
  UserCog,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { ChangePasswordDialog } from "@/components/shared/change-password-dialog";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";
import type { StaffPermissions } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "pending" | "coming-soon";
  separator?: boolean;
  permission?: keyof StaffPermissions | "adminOnly";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clientes", icon: Users, permission: "view_clients" },
  { href: "/admin/developments", label: "Imóveis", icon: MapPin, permission: "view_lots" },
  { href: "/admin/financial", label: "Financeiro", icon: DollarSign, permission: "view_financial", separator: true },
  { href: "/admin/financial-settings", label: "Config. Financeiras", icon: Cog, permission: "view_financial_settings" },
  { href: "/admin/economic-indices", label: "Índices Econômicos", icon: TrendingUp, permission: "view_financial_settings" },
  { href: "/admin/cycle-approvals", label: "Aprovação de Ciclos", icon: CheckCircle, badge: "pending", permission: "manage_financial" },
  { href: "/admin/transfers", label: "Transferências", icon: ArrowLeftRight, permission: "manage_clients" },
  { href: "/admin/early-payoff-requests", label: "Antecipações", icon: FastForward, permission: "manage_financial" },
  { href: "/admin/bank-statements", label: "Extratos Bancários", icon: FileSpreadsheet, badge: "coming-soon", permission: "view_financial" },
  { href: "/admin/services", label: "Serviços", icon: Wrench, permission: "view_service_requests", separator: true },
  { href: "/admin/sicredi/boletos", label: "Boletos", icon: Barcode, permission: "manage_sicredi" },
  { href: "/admin/sicredi/boletos/batch", label: "Lote Boletos", icon: ListChecks, permission: "manage_sicredi" },
  { href: "/admin/sicredi/config", label: "Config Sicredi", icon: Settings, permission: "manage_sicredi" },
  { href: "/admin/documents", label: "Documentos", icon: FolderOpen, permission: "view_documents" },
  { href: "/admin/service-requests", label: "Solicitações", icon: TicketCheck, permission: "view_service_requests" },
  { href: "/admin/settings/whatsapp", label: "WhatsApp", icon: MessageSquare, permission: "manage_whatsapp", separator: true },
  { href: "/admin/staff", label: "Funcionários", icon: UserCog, permission: "adminOnly", separator: true },
];

const ROLE_LABEL: Record<string, string> = {
  super_admin: "SUPER ADMIN",
  company_admin: "ADMINISTRADOR",
  staff: "STAFF",
  client: "CLIENTE",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin, loading, can } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { unreadCount } = useAdminNotifications();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (loading) return true;
    if (!item.permission) return true;
    if (item.permission === "adminOnly") return isAdmin;
    if (isAdmin) return true;
    return can(item.permission);
  });

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">CSApp</span>
            <span className="text-[11px] text-sidebar-foreground/60">Loteamentos</span>
          </div>
          <div className="flex items-center gap-1 ml-auto group-data-[collapsible=icon]:ml-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/notifications"
                  className="relative flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:hidden"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">Notificações</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-9 w-9 bg-sidebar-accent hover:bg-sidebar-accent/80" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="group-data-[collapsible=icon]:hidden">Recolher menu</span>
                <span className="hidden group-data-[collapsible=icon]:inline">Expandir menu</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-2 py-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item, idx) => {
                  const isActive = pathname.startsWith(item.href);
                  const showSeparator = item.separator && idx > 0;

                  return (
                    <>
                      {showSeparator && <SidebarSeparator className="my-1" />}
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link href={item.href}>
                            <item.icon className="h-5 w-5" />
                            <span className="flex-1 flex items-center justify-between">
                              {item.label}
                              {item.badge === "coming-soon" && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                                  Em breve
                                </span>
                              )}
                              {item.badge === "pending" && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white">
                                  !
                                </span>
                              )}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden gap-1 group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{user?.full_name}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold uppercase">
                  {user?.role ? ROLE_LABEL[user.role] ?? user.role : ""}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 shrink-0 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Alterar senha</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 shrink-0 p-0 text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </>
  );
}
