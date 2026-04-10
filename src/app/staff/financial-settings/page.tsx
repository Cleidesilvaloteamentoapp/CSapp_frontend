"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminFinancialSettingsPage from "@/app/admin/financial-settings/page";

export default function StaffFinancialSettingsPage() {
  useRequirePermission("view_financial_settings");
  return <AdminFinancialSettingsPage />;
}
