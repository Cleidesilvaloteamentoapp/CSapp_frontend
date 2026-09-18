"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { normalizeRole, getDefaultRedirect } from "@/lib/auth";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { MobileBackButton } from "@/components/layout/mobile-back-button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { BrandMark } from "@/components/layout/brand-mark";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Only CLIENT belongs here. Admins keep access for support purposes, but a
  // STAFF user must never land here: every /client/* endpoint rejects STAFF,
  // so the portal would render with empty data and look like a real account.
  const isPortalUser = user ? normalizeRole(user.role) !== "staff" : false;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isPortalUser) {
        router.replace(getDefaultRedirect(user.role));
      }
    }
  }, [user, loading, isPortalUser, router]);

  if (loading || !user || !isPortalUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <PortalSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <MobileBackButton />
          <Separator orientation="vertical" className="h-6" />
          <BrandMark variant="mobile" fallbackTagline="Portal do Cliente" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
