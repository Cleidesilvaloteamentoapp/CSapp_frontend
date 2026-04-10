"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminEconomicIndicesPage from "@/app/admin/economic-indices/page";

export default function StaffEconomicIndicesPage() {
  useRequirePermission("view_financial_settings");
  return <AdminEconomicIndicesPage />;
}
