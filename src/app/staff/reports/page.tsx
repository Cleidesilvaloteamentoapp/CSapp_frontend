"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import { PageHeader } from "@/components/layout/page-header";
import { FileText } from "lucide-react";

export default function StaffReportsPage() {
  useRequirePermission("view_reports");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Visualize os relatórios da empresa"
      />
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mb-4 opacity-30" />
        <p>Módulo de relatórios em desenvolvimento.</p>
      </div>
    </div>
  );
}
