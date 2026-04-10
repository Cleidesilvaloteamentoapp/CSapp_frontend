"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminClientsPage from "@/app/admin/clients/page";

export default function StaffClientsPage() {
  useRequirePermission("view_clients");
  return <AdminClientsPage />;
}
