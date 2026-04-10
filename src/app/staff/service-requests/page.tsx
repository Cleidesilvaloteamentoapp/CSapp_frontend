"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminServiceRequestsPage from "@/app/admin/service-requests/page";

export default function StaffServiceRequestsPage() {
  useRequirePermission("view_service_requests");
  return <AdminServiceRequestsPage />;
}
