"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import { PageHeader } from "@/components/layout/page-header";
import { FileX } from "lucide-react";

export default function StaffRescissionsPage() {
  useRequirePermission("view_rescissions");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distratos"
        description="Visualize os distratos da empresa"
      />
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <FileX className="h-10 w-10 mb-4 opacity-30" />
        <p>Módulo de distratos em desenvolvimento.</p>
      </div>
    </div>
  );
}
