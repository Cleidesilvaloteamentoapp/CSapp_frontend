"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminDashboardPage from "@/app/admin/dashboard/page";

export default function StaffDashboardPage() {
  useRequirePermission("view_financial");
  return <AdminDashboardPage />;
}
