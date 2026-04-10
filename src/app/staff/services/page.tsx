"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminServicesPage from "@/app/admin/services/page";

export default function StaffServicesPage() {
  useRequirePermission("view_service_requests");
  return <AdminServicesPage />;
}
