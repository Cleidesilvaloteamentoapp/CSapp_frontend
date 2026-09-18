"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { STAFF_NAV_ITEMS } from "@/lib/staff-nav";
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
import { BrandMark } from "@/components/layout/brand-mark";



export function StaffSidebar() {
  const pathname = usePathname();
  const { user, logout, can } = useAuth();
  const { state } = useSidebar();

  const visibleNavItems = STAFF_NAV_ITEMS.filter(
    (item) => item.permission === null || can(item.permission)
  );

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="flex h-16 items-center gap-3 px-4">
        <BrandMark variant="sidebar" fallbackTagline="Loteamentos" />
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
                          <span className="flex-1">{item.label}</span>
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
                STAFF
              </Badge>
              <span className="flex items-center gap-1 text-[10px] text-green-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                Ativo
              </span>
            </div>
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
