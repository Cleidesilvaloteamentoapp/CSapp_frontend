"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wrench, FolderOpen, Users, Barcode,
  Building2, LogOut, Bell, TicketCheck, User, FastForward,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/use-notifications";
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

const NAV_ITEMS = [
  { href: "/portal/dashboard", label: "Meu Painel", icon: LayoutDashboard },
  { href: "/portal/boletos", label: "Boletos", icon: Barcode },
  { href: "/portal/documents", label: "Documentos", icon: FolderOpen },
  { href: "/portal/service-requests", label: "Solicitações", icon: TicketCheck },
  { href: "/portal/services", label: "Serviços", icon: Wrench },
  { href: "/portal/referrals", label: "Indicações", icon: Users },
  { href: "/portal/early-payoff", label: "Antecipar Pagamento", icon: FastForward },
  { href: "/portal/notifications", label: "Notificações", icon: Bell, badge: true },
  { href: "/portal/profile", label: "Meu Perfil", icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = user?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">CSApp</span>
          <span className="text-[11px] text-sidebar-foreground/60">Portal do Cliente</span>
        </div>
        <div className="ml-auto">
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
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const showBadge = (item as any).badge && unreadCount > 0;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <div className="relative">
                          <item.icon className="h-5 w-5" />
                          {showBadge && collapsed && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 flex items-center justify-between">
                          {item.label}
                          {showBadge && !collapsed && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
          <div className="flex flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user?.full_name}</span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</span>
          </div>
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
      </SidebarFooter>
    </Sidebar>
  );
}
