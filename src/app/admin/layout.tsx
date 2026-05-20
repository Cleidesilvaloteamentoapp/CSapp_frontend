"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { canAccessAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { MobileBackButton } from "@/components/layout/mobile-back-button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!canAccessAdmin(user.role)) {
        router.replace("/portal/dashboard");
      }
    }
  }, [user, loading, router]);

  if (!loading && user && !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <MobileBackButton />
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-semibold">CSApp</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
