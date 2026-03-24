"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  LandPlot,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "pending" | "coming-soon";
  separator?: boolean;
  superAdminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/admin/developments", label: "Empreendimentos", icon: MapPin },
  { href: "/admin/lots", label: "Lotes", icon: LandPlot },
  { href: "/admin/financial", label: "Financeiro", icon: DollarSign, separator: true },
  { href: "/admin/financial-settings", label: "Config. Financeiras", icon: Cog },
  { href: "/admin/economic-indices", label: "Índices Econômicos", icon: TrendingUp, superAdminOnly: true },
  { href: "/admin/cycle-approvals", label: "Aprovação de Ciclos", icon: CheckCircle, badge: "pending" },
  { href: "/admin/transfers", label: "Transferências", icon: ArrowLeftRight, superAdminOnly: true },
  { href: "/admin/early-payoff-requests", label: "Antecipações", icon: FastForward },
  { href: "/admin/bank-statements", label: "Extratos Bancários", icon: FileSpreadsheet, badge: "coming-soon", superAdminOnly: true },
  { href: "/admin/services", label: "Serviços", icon: Wrench, separator: true },
  { href: "/admin/sicredi/boletos", label: "Boletos", icon: Barcode },
  { href: "/admin/sicredi/boletos/batch", label: "Lote Boletos", icon: ListChecks },
  { href: "/admin/sicredi/config", label: "Config Sicredi", icon: Settings },
  { href: "/admin/documents", label: "Documentos", icon: FolderOpen },
  { href: "/admin/service-requests", label: "Solicitações", icon: TicketCheck },
  { href: "/admin/settings/whatsapp", label: "WhatsApp", icon: MessageSquare, separator: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">CSApp</span>
              <span className="text-[11px] text-sidebar-foreground/60">Loteamentos</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "ml-auto h-7 w-7 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "ml-0"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNavItems.map((item, idx) => {
            const isActive = pathname.startsWith(item.href);
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && (
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
                )}
              </Link>
            );

            const showSeparator = item.separator && idx > 0;

            if (collapsed) {
              return (
                <div key={item.href}>
                  {showSeparator && <Separator className="my-2 bg-sidebar-border" />}
                  <Tooltip>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                      {item.badge === "coming-soon" && " (em breve)"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            }

            return (
              <div key={item.href}>
                {showSeparator && <Separator className="my-2 bg-sidebar-border" />}
                {linkContent}
              </div>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User */}
        <div className="p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{user?.full_name}</span>
                <span className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</span>
              </div>
            )}
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
      </aside>
    </TooltipProvider>
  );
}
