"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminFinancialPage from "@/app/admin/financial/page";

export default function StaffFinancialPage() {
  useRequirePermission("view_financial");
  return <AdminFinancialPage />;
}
