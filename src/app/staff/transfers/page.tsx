"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminTransfersPage from "@/app/admin/transfers/page";

export default function StaffTransfersPage() {
  useRequirePermission("manage_clients");
  return <AdminTransfersPage />;
}
