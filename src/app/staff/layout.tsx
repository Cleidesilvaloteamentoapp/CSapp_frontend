"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isStaffRole, getDefaultRedirect } from "@/lib/auth";
import { StaffSidebar } from "@/components/layout/staff-sidebar";
import { MobileBackButton } from "@/components/layout/mobile-back-button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, permissionsError, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isStaffRole(user.role)) {
        router.replace(getDefaultRedirect(user.role));
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isStaffRole(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Permissions failed to load. Every staff screen is gated on them, so
  // rendering the app here would deny access that the user may well have.
  if (permissionsError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Não foi possível carregar suas permissões</h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          Isto é uma falha de carregamento, não uma restrição de acesso. Tente
          novamente; se persistir, avise o administrador.
        </p>
        <Button onClick={() => refreshUser()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <StaffSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <MobileBackButton />
          <Separator orientation="vertical" className="h-6" />
          <BrandMark variant="mobile" fallbackTagline="Staff" />
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
