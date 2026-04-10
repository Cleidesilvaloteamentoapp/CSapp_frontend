"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshCw } from "lucide-react";

export default function StaffRenegotiationsPage() {
  useRequirePermission("view_renegotiations");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Renegociações"
        description="Visualize as renegociações da empresa"
      />
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <RefreshCw className="h-10 w-10 mb-4 opacity-30" />
        <p>Módulo de renegociações em desenvolvimento.</p>
      </div>
    </div>
  );
}
